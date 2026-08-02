"""APA Connect backend tests - auth, intervenants, callbacks, admin."""
import os
import secrets
import uuid
import pytest
import requests

BASE_URL = os.environ.get("APA_TEST_BASE_URL", "").rstrip("/")
if not BASE_URL:
    pytestmark = pytest.mark.skip(
        reason="Définir APA_TEST_BASE_URL pour exécuter les tests d'intégration explicites."
    )

API = f"{BASE_URL}/api"
ADMIN_EMAIL = os.environ.get("APA_TEST_ADMIN_EMAIL")
ADMIN_PASSWORD = os.environ.get("APA_TEST_ADMIN_PASSWORD")


@pytest.fixture(scope="module")
def session():
    return requests.Session()


@pytest.fixture(scope="module")
def admin_token(session):
    if not ADMIN_EMAIL or not ADMIN_PASSWORD:
        pytest.skip(
            "Définir APA_TEST_ADMIN_EMAIL et APA_TEST_ADMIN_PASSWORD pour les tests admin."
        )
    r = session.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    data = r.json()
    assert data["role"] == "admin"
    assert "token" in data
    return data["token"]


@pytest.fixture(scope="module")
def intervenant_creds():
    suffix = uuid.uuid4().hex[:8]
    return {
        "email": f"TEST_intervenant_{suffix}@apaconnect.fr",
        "password": secrets.token_urlsafe(18),
        "first_name": "TestFn",
        "last_name": "TestLn",
    }


@pytest.fixture(scope="module")
def intervenant_token(session, intervenant_creds):
    r = session.post(f"{API}/auth/register", json=intervenant_creds)
    assert r.status_code == 200, f"Register failed: {r.status_code} {r.text}"
    return r.json()["token"]


def auth(token):
    return {"Authorization": f"Bearer {token}"}


# -------- Health & Public --------
class TestPublic:
    def test_health(self, session):
        r = session.get(f"{API}/health")
        assert r.status_code == 200
        assert r.json() == {"status": "ok", "database": "connected"}

    def test_root(self, session):
        r = session.get(f"{API}/")
        assert r.status_code == 200
        assert r.json().get("ok") is True

    def test_list_intervenants_seed(self, session):
        r = session.get(f"{API}/intervenants")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 5, f"Expected >=5 seeded, got {len(data)}"
        names = [f"{x['first_name']} {x['last_name']}" for x in data]
        assert "Sophie Martin" in names

    def test_sophie_available_today(self, session):
        r = session.get(f"{API}/intervenants", params={"available_today": "true"})
        assert r.status_code == 200
        data = r.json()
        assert any(x["first_name"] == "Sophie" and x["available_today"] for x in data)

    def test_filter_city(self, session):
        r = session.get(f"{API}/intervenants", params={"city": "Rouen"})
        assert r.status_code == 200
        for x in r.json():
            assert "rouen" in x["city"].lower()

    def test_filter_home(self, session):
        r = session.get(f"{API}/intervenants", params={"home": "true"})
        assert r.status_code == 200
        for x in r.json():
            assert "domicile" in x["intervention_places"]

    def test_filter_verified(self, session):
        r = session.get(f"{API}/intervenants", params={"verified": "true"})
        assert r.status_code == 200
        for x in r.json():
            assert x["diploma_verified"] is True

    def test_filter_available_week(self, session):
        r = session.get(f"{API}/intervenants", params={"available_week": "true"})
        assert r.status_code == 200
        for x in r.json():
            assert x["available_this_week"] is True

    def test_get_intervenant_detail(self, session):
        r = session.get(f"{API}/intervenants")
        first_id = r.json()[0]["id"]
        d = session.get(f"{API}/intervenants/{first_id}")
        assert d.status_code == 200
        assert d.json()["id"] == first_id

    def test_get_intervenant_404(self, session):
        r = session.get(f"{API}/intervenants/nonexistent-id-xyz")
        assert r.status_code == 404


# -------- Auth --------
class TestAuth:
    def test_admin_login(self, admin_token):
        assert admin_token

    def test_login_wrong_password(self, session):
        if not ADMIN_EMAIL:
            pytest.skip("Définir APA_TEST_ADMIN_EMAIL pour ce test.")
        r = session.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"})
        assert r.status_code == 401

    def test_register_and_login(self, session, intervenant_creds, intervenant_token):
        # Login again with same creds
        r = session.post(f"{API}/auth/login", json={
            "email": intervenant_creds["email"], "password": intervenant_creds["password"]
        })
        assert r.status_code == 200
        assert r.json()["role"] == "intervenant"

    def test_register_duplicate(self, session, intervenant_creds):
        r = session.post(f"{API}/auth/register", json=intervenant_creds)
        assert r.status_code == 400

    def test_me_authenticated(self, session, intervenant_token):
        r = session.get(f"{API}/auth/me", headers=auth(intervenant_token))
        assert r.status_code == 200
        assert r.json()["role"] == "intervenant"

    def test_me_unauth(self, session):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_logout(self, session):
        r = requests.post(f"{API}/auth/logout")
        assert r.status_code == 200


# -------- Intervenant self --------
class TestIntervenantSelf:
    def test_get_my_profile(self, session, intervenant_token):
        r = requests.get(f"{API}/intervenants/me", headers=auth(intervenant_token))
        assert r.status_code == 200
        assert r.json()["first_name"] == "TestFn"

    def test_update_profile(self, session, intervenant_token):
        payload = {
            "first_name": "TestFn", "last_name": "TestLn", "city": "Rouen",
            "zone": "Centre", "diploma": "Master APA",
            "publics": ["Seniors"], "intervention_places": ["domicile", "cabinet"],
            "phone": "0600000000", "bio": "Bio test", "lat": 49.4432, "lng": 1.0993,
            "intervention_radius_km": 20, "experience_years": 4,
            "experience_domains": ["Maintien de l'autonomie"],
            "accompaniment_types": ["Mobilité et équilibre"],
            "accompaniment_formats": ["Individuel", "Collectif"],
            "indicative_rate": "Sur devis", "payment_methods": ["Chèque"],
            "estimated_wait_days": 7, "individual_places_available": 2,
            "collective_places_available": 5,
        }
        r = requests.put(f"{API}/intervenants/me", headers=auth(intervenant_token), json=payload)
        assert r.status_code == 200
        assert r.json()["city"] == "Rouen"
        assert r.json()["intervention_radius_km"] == 20
        # GET to verify persistence
        g = requests.get(f"{API}/intervenants/me", headers=auth(intervenant_token))
        assert g.json()["city"] == "Rouen"

    def test_set_availability_and_today(self, session, intervenant_token):
        from datetime import date
        today = date.today().isoformat()
        r = requests.post(f"{API}/intervenants/me/availability",
                          headers=auth(intervenant_token),
                          json={
                              "availability": {today: {"morning": True, "afternoon": False}},
                              "availability_status": "available",
                              "estimated_wait_days": 7,
                              "individual_places_available": 2,
                              "collective_places_available": 5,
                          })
        assert r.status_code == 200
        prof = r.json()
        assert prof["availability_week"] != ""
        assert prof["availability_status"] == "available"
        # Find self via public list
        l = requests.get(f"{API}/intervenants", params={"available_today": "true"}).json()
        assert any(x["id"] == prof["id"] for x in l)

    def test_keep_availability(self, session, intervenant_token):
        r = requests.post(f"{API}/intervenants/me/keep-availability", headers=auth(intervenant_token))
        assert r.status_code == 200

    def test_mark_unavailable(self, session, intervenant_token):
        r = requests.post(f"{API}/intervenants/me/unavailable", headers=auth(intervenant_token))
        assert r.status_code == 200
        assert r.json()["availability"] == {}
        assert r.json()["availability_status"] == "unavailable"
        assert r.json()["availability_confirmed_at"] is not None

    def test_unauth_blocks(self, session):
        r = requests.get(f"{API}/intervenants/me")
        assert r.status_code == 401


# -------- Callbacks --------
class TestCallbacks:
    def test_create_callback(self, session):
        l = requests.get(f"{API}/intervenants").json()
        target = l[0]["id"]
        r = requests.post(f"{API}/callbacks", json={
            "intervenant_id": target, "first_name": "Patient",
            "contact": "0600000000", "city": "Rouen", "need": "APA seniors", "message": "Test"
        })
        assert r.status_code == 200
        assert r.json().get("ok") is True

    def test_callback_invalid_intervenant(self, session):
        r = requests.post(f"{API}/callbacks", json={
            "intervenant_id": "nope", "first_name": "X", "contact": "0", "city": "X", "need": "X"
        })
        assert r.status_code == 404


# -------- Admin --------
class TestAdmin:
    def test_admin_list_intervenants(self, admin_token):
        r = requests.get(f"{API}/admin/intervenants", headers=auth(admin_token))
        assert r.status_code == 200
        assert len(r.json()) >= 5

    def test_admin_callbacks(self, admin_token):
        r = requests.get(f"{API}/admin/callbacks", headers=auth(admin_token))
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_admin_validate_diploma(self, admin_token):
        l = requests.get(f"{API}/admin/intervenants", headers=auth(admin_token)).json()
        target = next(x for x in l if not x.get("diploma_verified"))
        r = requests.post(f"{API}/admin/intervenants/{target['id']}/validate-diploma", headers=auth(admin_token))
        assert r.status_code == 200
        d = requests.get(f"{API}/intervenants/{target['id']}").json()
        assert d["diploma_verified"] is True

    def test_admin_toggle_hidden(self, admin_token):
        l = requests.get(f"{API}/admin/intervenants", headers=auth(admin_token)).json()
        target = l[-1]
        r = requests.post(f"{API}/admin/intervenants/{target['id']}/toggle-hidden", headers=auth(admin_token))
        assert r.status_code == 200
        # Toggle back
        requests.post(f"{API}/admin/intervenants/{target['id']}/toggle-hidden", headers=auth(admin_token))

    def test_admin_requires_admin(self, intervenant_token):
        r = requests.get(f"{API}/admin/intervenants", headers=auth(intervenant_token))
        assert r.status_code == 403
