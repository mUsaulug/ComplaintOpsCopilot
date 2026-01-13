from dataclasses import dataclass
from typing import Iterable, List

from app.core.logging import get_logger
from app.services.masking_service import masker

logger = get_logger("complaintops.pii_scan")


@dataclass
class PiiScanResult:
    contains_pii: bool
    masked_text: str
    entity_types: List[str]


def scan_text(text: str) -> PiiScanResult:
    if not text:
        return PiiScanResult(contains_pii=False, masked_text=text, entity_types=[])

    masked_text, presidio_entities, regex_entities = masker.mask_with_double_pass(text)
    entity_types = [e["type"] for e in presidio_entities] + [e["type"] for e in regex_entities]
    contains_pii = masked_text != text

    if contains_pii:
        logger.warning("pii_detected entity_types=%s", ",".join(sorted(set(entity_types))))

    return PiiScanResult(contains_pii=contains_pii, masked_text=masked_text, entity_types=entity_types)


def scan_texts(texts: Iterable[str]) -> PiiScanResult:
    combined = " ".join([t for t in texts if t])
    return scan_text(combined)
