"""
Basic tests for HelpDesk Pro.
These tests verify the app starts and core endpoints work.
"""

import sys
import os

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
import app as helpdesk_app


# ---------- Test Client ----------
@pytest.fixture
def client():
    helpdesk_app.app.config['TESTING'] = True
    helpdesk_app.app.config['SECRET_KEY'] = 'test-secret'

    with helpdesk_app.app.test_client() as client:
        yield client


# ---------- Tests ----------
def test_app_imports_correctly():
    """Verify the Flask app object exists."""
    assert helpdesk_app.app is not None


def test_health_check_returns_200(client):
    """Health endpoint should always return 200."""
    response = client.get('/health')

    assert response.status_code == 200

    data = response.get_json()
    assert data['status'] == 'healthy'


def test_login_page_loads(client):
    """Login page should be accessible."""
    response = client.get('/login')

    assert response.status_code == 200


def test_dashboard_redirects_when_not_logged_in(client):
    """Dashboard must redirect unauthenticated users to login."""
    response = client.get('/dashboard')

    assert response.status_code == 302


def test_root_redirects(client):
    """Root URL should redirect."""
    response = client.get('/')

    assert response.status_code == 302


def test_register_page_loads(client):
    """Register page should load."""
    response = client.get('/register')

    assert response.status_code == 200