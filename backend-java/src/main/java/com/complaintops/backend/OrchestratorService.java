package com.complaintops.backend;

import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import lombok.RequiredArgsConstructor;
import java.util.List;
import java.util.ArrayList;
import java.util.UUID;
import java.time.Duration;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Objects;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.reactive.function.client.WebClientRequestException;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.util.retry.Retry;

@Service
@RequiredArgsConstructor
public class OrchestratorService {

    private static final Logger logger = LoggerFactory.getLogger(OrchestratorService.class);
    private static final Duration MASK_TIMEOUT = Duration.ofSeconds(10);
    private static final Duration AI_TIMEOUT = Duration.ofSeconds(30);
    private static final Duration RETRY_BACKOFF = Duration.ofMillis(300);

    private final ComplaintRepository repository;
    private final WebClient.Builder webClientBuilder;

    @Value("${ai-service.url}")
    private String aiServiceUrl;

    /**
     * KVKK-Aware Complaint Analysis
     * FAIL-CLOSED: If masking fails, pipeline stops immediately.
     * Raw text NEVER goes to LLM, DB, or logs.
     */
    public Complaint analyzeComplaint(String rawText) {
        String requestId = UUID.randomUUID().toString();
        WebClient webClient = webClientBuilder.baseUrl(Objects.requireNonNull(aiServiceUrl)).build();
        logger.info("Starting complaint analysis. request_id={}", requestId);

        // 1. Mask PII - FAIL-CLOSED: No fallback to raw text
        DTOs.MaskingResponse maskResp;
        try {
            maskResp = webClient.post()
                    .uri("/mask")
                    .header("X-Request-ID", requestId)
                    .bodyValue(new DTOs.MaskingRequest(rawText))
                    .retrieve()
                    .bodyToMono(DTOs.MaskingResponse.class)
                    .retryWhen(buildRetrySpec("masking"))
                    .block(MASK_TIMEOUT);
        } catch (Exception e) {
            // FAIL-CLOSED: Pipeline stops, create failed record without raw text
            logger.error("MASKING_FAILED: PII masking service unavailable. Raw text protected.");

            Complaint failedComplaint = new Complaint();
            failedComplaint.setMaskedText("[MASKING_ERROR - İçerik korumalı]");
            failedComplaint.setCategory("UNKNOWN");
            failedComplaint.setUrgency("HIGH");
            failedComplaint.setTriageStatus("FAILED");
            failedComplaint.setRiskLevel("HIGH");
            failedComplaint.setNeedsHumanReview(true);
            failedComplaint.setActionPlan("[\"Manuel inceleme gerekli: Maskeleme servisi hatası\"]");
            failedComplaint.setCustomerReplyDraft("Şikayetiniz alındı. Manuel inceleme için yönlendirildi.");
            failedComplaint.setStatus(ComplaintStatus.MASKING_FAILED);
            return repository.save(failedComplaint);
        }

        // Validate masking response
        if (maskResp == null || maskResp.getMaskedText() == null || maskResp.getMaskedText().isBlank()) {
            logger.error("MASKING_FAILED: Empty masking response. Raw text protected.");

            Complaint failedComplaint = new Complaint();
            failedComplaint.setMaskedText("[MASKING_ERROR - İçerik korumalı]");
            failedComplaint.setCategory("UNKNOWN");
            failedComplaint.setUrgency("HIGH");
            failedComplaint.setTriageStatus("FAILED");
            failedComplaint.setRiskLevel("HIGH");
            failedComplaint.setNeedsHumanReview(true);
            failedComplaint.setActionPlan("[\"Manuel inceleme gerekli: Boş maskeleme yanıtı\"]");
            failedComplaint.setCustomerReplyDraft("Şikayetiniz alındı. Manuel inceleme için yönlendirildi.");
            failedComplaint.setStatus(ComplaintStatus.MASKING_FAILED);
            return repository.save(failedComplaint);
        }

        String safeText = maskResp.getMaskedText();
        logger.info("PII masking successful. Masked entities: {}", maskResp.getMaskedEntities());

        // 2. Triage (with confidence tracking)
        DTOs.TriageResponseFull triageResp;
        try {
            triageResp = webClient.post()
                    .uri("/predict")
                    .header("X-Request-ID", requestId)
                    .bodyValue(new DTOs.TriageRequest(safeText))
                    .retrieve()
                    .bodyToMono(DTOs.TriageResponseFull.class)
                    .retryWhen(buildRetrySpec("triage"))
                    .block(AI_TIMEOUT);
        } catch (Exception e) {
            logger.warn("Triage failed, using defaults: {}", e.getMessage());
            triageResp = new DTOs.TriageResponseFull();
            triageResp.setCategory("UNKNOWN");
            triageResp.setUrgency("MEDIUM");
            triageResp.setNeedsHumanReview(true);
            triageResp.setTriageStatus("FAILED");
        }

        // 3. RAG Retrieval
        DTOs.RAGResponse ragResp;
        String ragStatus = "OK";
        try {
            ragResp = webClient.post()
                    .uri("/retrieve")
                    .header("X-Request-ID", requestId)
                    .bodyValue(new DTOs.RAGRequest(safeText, triageResp.getCategory()))
                    .retrieve()
                    .bodyToMono(DTOs.RAGResponse.class)
                    .retryWhen(buildRetrySpec("rag"))
                    .block(AI_TIMEOUT);
        } catch (Exception e) {
            logger.warn("RAG failed: {}", e.getMessage());
            ragResp = new DTOs.RAGResponse();
            ragResp.setRelevantSources(new ArrayList<>());
            ragStatus = "UNAVAILABLE";
        }

        // 4. Generate Response
        DTOs.GenerateResponse genResp;
        String llmStatus = "OK";
        try {
            genResp = webClient.post()
                    .uri("/generate")
                    .header("X-Request-ID", requestId)
                    .bodyValue(new DTOs.GenerateRequest(
                            safeText,
                            triageResp.getCategory(),
                            triageResp.getUrgency(),
                            ragResp.getRelevantSources()))
                    .retrieve()
                    .bodyToMono(DTOs.GenerateResponse.class)
                    .retryWhen(buildRetrySpec("generate"))
                    .block(AI_TIMEOUT);
        } catch (Exception e) {
            logger.warn("Generation failed: {}", e.getMessage());
            genResp = new DTOs.GenerateResponse();
            genResp.setActionPlan(List.of("Sistem Hatası: AI yanıt üretemedi. Manuel inceleme gerekli."));
            genResp.setCustomerReplyDraft("Şikayetiniz alındı. En kısa sürede size dönüş yapılacaktır.");
            genResp.setSources(new ArrayList<>());
            llmStatus = "TEMPLATE_FALLBACK";
        }

        // 5. Save to DB - NO RAW TEXT EVER
        Complaint complaint = new Complaint();
        // originalText KALDIRILDI - KVKK uyumu
        complaint.setMaskedText(safeText);
        complaint.setCategory(triageResp.getCategory());
        complaint.setUrgency(triageResp.getUrgency());

        ObjectMapper mapper = new ObjectMapper();
        try {
            complaint.setActionPlan(mapper.writeValueAsString(genResp.getActionPlan()));
        } catch (Exception e) {
            complaint.setActionPlan(String.valueOf(genResp.getActionPlan()));
        }

        // Save RAG sources for explainability
        try {
            complaint.setSources(mapper.writeValueAsString(genResp.getSources()));
        } catch (Exception e) {
            complaint.setSources("[]");
        }

        complaint.setCustomerReplyDraft(genResp.getCustomerReplyDraft());
        complaint.setStatus(ComplaintStatus.ANALYZED);

        // Human-in-the-Loop fields
        complaint.setNeedsHumanReview(triageResp.isNeedsHumanReview());
        complaint.setReviewId(triageResp.getReviewId());

        // Confidence scores
        complaint.setCategoryConfidence(triageResp.getCategoryConfidence());
        complaint.setUrgencyConfidence(triageResp.getUrgencyConfidence());

        // Graceful degradation status
        complaint.setRagStatus(ragStatus);
        complaint.setLlmStatus(llmStatus);

        logger.info(
                "Complaint analysis complete. request_id={} category={} urgency={} needs_review={} rag_status={} llm_status={}",
                requestId, triageResp.getCategory(), triageResp.getUrgency(), triageResp.isNeedsHumanReview(),
                ragStatus, llmStatus);

        return repository.save(complaint);
    }

    private Retry buildRetrySpec(String stage) {
        return Retry.backoff(2, RETRY_BACKOFF)
                .filter(this::isRetryable)
                .onRetryExhaustedThrow((spec, signal) -> signal.failure())
                .doBeforeRetry(retrySignal -> logger.warn("Retrying stage={} attempt={} due_to={}",
                        stage,
                        retrySignal.totalRetries() + 1,
                        retrySignal.failure() != null ? retrySignal.failure().getMessage() : "unknown"));
    }

    private boolean isRetryable(Throwable throwable) {
        if (throwable instanceof WebClientRequestException) {
            return true;
        }
        if (throwable instanceof WebClientResponseException responseException) {
            return responseException.getStatusCode().is5xxServerError();
        }
        return false;
    }

    public List<Complaint> getAllComplaints() {
        return repository.findAll();
    }

    public Complaint getComplaint(Long id) {
        return repository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Complaint not found"));
    }
}
