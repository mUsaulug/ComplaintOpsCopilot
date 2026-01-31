import os

import pytest


@pytest.mark.parametrize("text,expected", [
    ("TC: 12345678901", True),
    ("IBAN: TR330006100519786457841326", True),
    ("Telefon: 05551234567", True),
    ("Sıradan bir metin", False),
])
def test_regex_only_mode_masks_expected(text, expected):
    os.environ["PII_REGEX_ONLY"] = "true"
    from app.services.masking_service import masker

    masked_text, presidio_entities, regex_entities = masker.mask_with_double_pass(text)
    contains_pii = masked_text != text
    assert contains_pii is expected
