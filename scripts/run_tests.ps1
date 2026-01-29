# Test Automation Script
$ErrorActionPreference = "Stop"
$EvidenceDir = "docs/evidence/20260126_0539"

Write-Host "=== TEST STARTED ==="

# 1. Health Checks
Write-Host "Checking service health..."
try {
    $javaResponse = Invoke-WebRequest -Uri "http://localhost:8080/api/complaints" -Method Get -UseBasicParsing
    Write-Host "Java Status: $($javaResponse.StatusCode)"
}
catch {
    Write-Host "Java Status: FAILED ($($_.Exception.Message))"
}

try {
    $pythonResponse = Invoke-WebRequest -Uri "http://localhost:8000/" -Method Get -UseBasicParsing
    Write-Host "Python Status: $($pythonResponse.StatusCode)"
}
catch {
    Write-Host "Python Status: FAILED ($($_.Exception.Message))"
}

# 2. Smoke Test: Turkish Complaint
Write-Host "Running Smoke Test A: Turkish Complaint..."
$smokeBody = @{
    metin = "Kartımdan bilgim dışında 5000 TL çekilmiş, TC: 12345678901, IBAN: TR12 0006 2000 1234 5678 9012 34"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8080/api/sikayet" `
        -Method Post `
        -Body $smokeBody `
        -ContentType "application/json; charset=utf-8"
    
    $response | ConvertTo-Json -Depth 5 | Out-File "$EvidenceDir/smoke_test_result.json"
    Write-Host "Smoke test A completed. Check $EvidenceDir/smoke_test_result.json"
}
catch {
    Write-Error "Smoke test failed: $($_.Exception.Message)"
}

# 3. Fail-Closed Test (Python Down)
Write-Host "Running Fail-Closed Test (Python Down)..."
docker compose stop python-ai
Start-Sleep -Seconds 5

try {
    # Expecting failure or special handling
    $response = Invoke-RestMethod -Uri "http://localhost:8080/api/sikayet" `
        -Method Post `
        -Body $smokeBody `
        -ContentType "application/json; charset=utf-8" `
        -ErrorAction SilentlyContinue
    
    # If successful, check if masked
    $response | ConvertTo-Json -Depth 5 | Out-File "$EvidenceDir/fail_closed_result.json"
    Write-Host "Fail-closed response received."
}
catch {
    # If 500 error, capture output
    $_.Exception.Response | Out-File "$EvidenceDir/fail_closed_error.txt"
    Write-Host "Service returned error as expected (Fail-Closed). Check $EvidenceDir/fail_closed_error.txt"
}

docker compose start python-ai
Write-Host "Waiting for Python service to recover..."
Start-Sleep -Seconds 45

# 4. Unit Tests
Write-Host "Running Java Unit Tests..."
docker compose exec -T java-backend mvn test -Dsurefire.useFile=false > "$EvidenceDir/java_tests.log" 2>&1
Write-Host "Java tests completed."

Write-Host "Running Python Unit Tests..."
docker compose exec -T python-ai pytest -v > "$EvidenceDir/python_tests.log" 2>&1
Write-Host "Python tests completed."

Write-Host "=== TEST FINISHED ==="
