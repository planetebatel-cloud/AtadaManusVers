"""
ATADA — Payments API Routes (Stripe Test Mode)
POST /api/payments/checkout    → create Stripe checkout session
POST /api/payments/webhook     → Stripe webhook handler
GET  /api/payments/invoices    → list user invoices
"""

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.config import settings
from app.db.database import get_db
from app.domain.models import User, Invoice
from app.domain.schemas import CreateCheckoutSession, CheckoutSessionOut, InvoiceOut
from app.api.deps import get_current_user

router = APIRouter(prefix="/api/payments", tags=["payments"])

stripe.api_key = settings.STRIPE_SECRET_KEY

PLANS = {
    # Workers use Atada 100% free (Israeli law prohibits charging job seekers)
    "employer_starter": {"name": "Employer Starter", "price_agorot": 19900, "description": "Single job posting (30 days)", "mode": "payment"},
    "employer_pro": {"name": "Employer Pro", "price_agorot": 99900, "description": "Unlimited posts, analytics dashboard", "mode": "subscription"},
    "employer_enterprise": {"name": "Enterprise", "price_agorot": 0, "description": "Custom pricing — contact sales", "mode": "contact"},
}


@router.post("/checkout", response_model=CheckoutSessionOut)
def create_checkout(
    body: CreateCheckoutSession,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    plan = PLANS.get(body.plan)
    if not plan:
        raise HTTPException(status_code=400, detail=f"Unknown plan: {body.plan}")

    if plan.get("mode") == "contact":
        return CheckoutSessionOut(session_id="contact", url="mailto:hello@atada.co.il")

    try:
        is_subscription = plan.get("mode") == "subscription"
        price_data: dict = {
            "currency": "ils",
            "product_data": {"name": plan["name"]},
            "unit_amount": plan["price_agorot"],
        }
        if is_subscription:
            price_data["recurring"] = {"interval": "month"}

        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{"price_data": price_data, "quantity": 1}],
            mode="subscription" if is_subscription else "payment",
            success_url=body.success_url,
            cancel_url=body.cancel_url,
            client_reference_id=user.id,
            metadata={"plan": body.plan},
        )
        return CheckoutSessionOut(session_id=session.id, url=session.url)

    except stripe.error.AuthenticationError:
        # Stripe test key not configured — return mock
        return CheckoutSessionOut(
            session_id="cs_test_mock_" + user.id[:8],
            url=body.success_url + "&mock=true",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET,
        )
    except (ValueError, stripe.error.SignatureVerificationError):
        raise HTTPException(status_code=400, detail="Invalid webhook")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        user_id = session.get("client_reference_id")
        plan = session.get("metadata", {}).get("plan", "pro")

        if user_id:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                user.plan = plan
                user.stripe_customer_id = session.get("customer")
                db.commit()

                # Create invoice record
                plan_info = PLANS.get(plan, {})
                invoice = Invoice(
                    user_id=user_id,
                    stripe_invoice_id=session.get("invoice"),
                    amount=plan_info.get("price_agorot", 0),
                    description=plan_info.get("description", ""),
                    status="paid",
                )
                db.add(invoice)
                db.commit()

    return {"status": "ok"}


@router.get("/invoices", response_model=list[InvoiceOut])
def list_invoices(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    invoices = (
        db.query(Invoice)
        .filter(Invoice.user_id == user.id)
        .order_by(Invoice.created_at.desc())
        .all()
    )
    return [InvoiceOut.model_validate(i) for i in invoices]
