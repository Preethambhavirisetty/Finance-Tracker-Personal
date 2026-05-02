import os

import plaid
from plaid.api import plaid_api
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
from plaid.model.country_code import CountryCode
from plaid.model.products import Products
from plaid.model.item_public_token_exchange_request import (
    ItemPublicTokenExchangeRequest,
)
from plaid.model.accounts_get_request import AccountsGetRequest
from plaid.model.transactions_sync_request import TransactionsSyncRequest
from plaid.model.item_remove_request import ItemRemoveRequest

PLAID_CATEGORY_MAP = {
    "FOOD_AND_DRINK": {"name": "Food & Dining", "icon": "🍔", "color": "#F59E0B"},
    "TRANSPORTATION": {"name": "Transportation", "icon": "🚗", "color": "#3B82F6"},
    "TRAVEL": {"name": "Travel", "icon": "✈️", "color": "#8B5CF6"},
    "GENERAL_MERCHANDISE": {"name": "Shopping", "icon": "🛒", "color": "#EC4899"},
    "PERSONAL_CARE": {"name": "Personal Care", "icon": "💆", "color": "#F472B6"},
    "ENTERTAINMENT": {"name": "Entertainment", "icon": "🎮", "color": "#7C3AED"},
    "HEALTHCARE": {"name": "Healthcare", "icon": "🏥", "color": "#EF4444"},
    "RENT_AND_UTILITIES": {"name": "Housing", "icon": "🏠", "color": "#10B981"},
    "HOME_IMPROVEMENT": {"name": "Home", "icon": "🏡", "color": "#059669"},
    "GENERAL_SERVICES": {"name": "Services", "icon": "⚙️", "color": "#6B7280"},
    "GOVERNMENT_AND_NON_PROFIT": {
        "name": "Government",
        "icon": "🏛️",
        "color": "#64748B",
    },
    "TRANSFER_IN": {"name": "Transfer In", "icon": "💸", "color": "#059669"},
    "TRANSFER_OUT": {"name": "Transfer Out", "icon": "💸", "color": "#6B7280"},
    "INCOME": {"name": "Income", "icon": "💰", "color": "#059669"},
    "LOAN_PAYMENTS": {"name": "Debt Payments", "icon": "💳", "color": "#DC2626"},
    "BANK_FEES": {"name": "Bank Fees", "icon": "🏦", "color": "#94A3B8"},
    "EDUCATION": {"name": "Education", "icon": "🎓", "color": "#2563EB"},
}

PLAID_ACCOUNT_TYPE_MAP = {
    ("depository", "checking"): ("bank", "🏦", "#3B82F6"),
    ("depository", "savings"): ("savings", "🐷", "#10B981"),
    ("credit", "credit card"): ("credit_card", "💳", "#8B5CF6"),
    ("investment", "brokerage"): ("investment", "📈", "#F59E0B"),
    ("loan", None): ("other", "💰", "#6B7280"),
}


def get_plaid_client():
    env_name = os.environ.get("PLAID_ENV", "sandbox").lower()
    host = {
        "production": plaid.Environment.Production,
        "development": plaid.Environment.Sandbox,
    }.get(env_name, plaid.Environment.Sandbox)

    client_id = os.environ.get("PLAID_CLIENT_ID", "")
    secret = os.environ.get("PLAID_SECRET", "")
    if not client_id or not secret:
        raise RuntimeError("PLAID_CLIENT_ID and PLAID_SECRET must be configured")

    configuration = plaid.Configuration(
        host=host,
        api_key={
            "clientId": client_id,
            "secret": secret,
        },
    )
    return plaid_api.PlaidApi(plaid.ApiClient(configuration))


def create_link_token(user_id: int) -> str:
    client = get_plaid_client()
    request = LinkTokenCreateRequest(
        user=LinkTokenCreateRequestUser(client_user_id=str(user_id)),
        client_name="Monarch Finance",
        products=[Products("transactions")],
        country_codes=[CountryCode("US")],
        language="en",
    )
    webhook = os.environ.get("PLAID_WEBHOOK_URL")
    if webhook:
        request.webhook = webhook

    response = client.link_token_create(request)
    return response["link_token"]


def exchange_public_token(public_token: str):
    client = get_plaid_client()
    response = client.item_public_token_exchange(
        ItemPublicTokenExchangeRequest(public_token=public_token)
    )
    return response["access_token"], response["item_id"]


def fetch_plaid_accounts(access_token: str) -> list:
    client = get_plaid_client()
    response = client.accounts_get(AccountsGetRequest(access_token=access_token))
    return response["accounts"]


def remove_plaid_item(access_token: str):
    client = get_plaid_client()
    client.item_remove(ItemRemoveRequest(access_token=access_token))


def sync_transactions(access_token: str, cursor=None):
    client = get_plaid_client()
    kwargs = {"access_token": access_token}
    if cursor:
        kwargs["cursor"] = cursor

    request = TransactionsSyncRequest(**kwargs)
    response = client.transactions_sync(request)
    return (
        response["added"],
        response["modified"],
        response["removed"],
        response["next_cursor"],
        response["has_more"],
    )


def map_plaid_account_type(plaid_type: str, plaid_subtype: str):
    key = (plaid_type, plaid_subtype)
    return PLAID_ACCOUNT_TYPE_MAP.get(
        key, PLAID_ACCOUNT_TYPE_MAP.get((plaid_type, None), ("bank", "🏦", "#3B82F6"))
    )


def map_plaid_category(personal_finance_category, tx_type: str):
    if personal_finance_category:
        primary = (
            personal_finance_category.get("primary", "")
            if hasattr(personal_finance_category, "get")
            else getattr(personal_finance_category, "primary", "")
        )
        info = PLAID_CATEGORY_MAP.get(primary)
        if info:
            return info

    if tx_type == "income":
        return {"name": "Income", "icon": "💰", "color": "#059669"}
    return {"name": "Other", "icon": "📁", "color": "#6B7280"}
