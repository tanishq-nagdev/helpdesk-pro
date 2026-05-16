"""
Tests for HelpDesk Pro API backend.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
import app as helpdesk_app


@pytest.fixture
def client():
    helpdesk_app.app.config['TESTING'] = True
    helpdesk_app.app.config['SECRET_KEY'] = 'test-secret'
    with helpdesk_app.app.test_client() as client:
        yield client


def test_app_imports_correctly():
    assert helpdesk_app.app is not None


def test_health_check_returns_200(client):
    response = client.get('/api/health')
    assert response.status_code == 200
    data = response.get_json()
    assert data['status'] == 'healthy'


def test_login_endpoint_exists(client):
    # Should return 401 with bad credentials, not 404
    response = client.post('/api/login',
                           json={'username': 'nobody', 'password': 'wrong'})
    assert response.status_code in (401, 500)  # 500 if DB unreachable in CI


def test_me_returns_401_when_not_logged_in(client):
    response = client.get('/api/me')
    assert response.status_code == 401


def test_tickets_returns_401_when_not_logged_in(client):
    response = client.get('/api/tickets')
    assert response.status_code == 401


def test_dashboard_route_does_not_exist(client):
    # Old SSR route must be gone
    response = client.get('/dashboard')
    assert response.status_code == 404
