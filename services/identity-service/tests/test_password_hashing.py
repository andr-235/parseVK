import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.modules.pop("_service_path", None)

from _service_path import use_service_path

use_service_path()

from app.core.security import hash_password, verify_password


def test_password_hashing_verifies_correct_password():
    password_hash = hash_password("correct horse battery staple")

    assert verify_password("correct horse battery staple", password_hash)


def test_password_hashing_rejects_wrong_password():
    password_hash = hash_password("correct horse battery staple")

    assert not verify_password("wrong password", password_hash)
