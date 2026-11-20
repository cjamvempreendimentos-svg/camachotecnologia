CREATE TABLE site_coupons (
  id UUID PRIMARY KEY,
  campaign TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 100),
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  price INTEGER NOT NULL CHECK (price > 0),
  discount INTEGER NOT NULL CHECK (discount BETWEEN 100 AND 500 AND discount < price),
  terms_version TEXT NOT NULL,
  marketing_consent BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  activated_at TIMESTAMPTZ,
  used_at TIMESTAMPTZ,
  UNIQUE(campaign, phone),
  UNIQUE(campaign, email),
  CHECK (used_at IS NULL OR activated_at IS NOT NULL)
);
CREATE INDEX site_coupons_created_at_idx ON site_coupons (created_at DESC, id DESC);
-- No browser/anonymous database API: access only through authenticated server functions.
CREATE TABLE site_coupon_events (
  id UUID PRIMARY KEY,
  coupon_id UUID NOT NULL REFERENCES site_coupons(id),
  action TEXT NOT NULL CHECK (action IN ('created', 'activated', 'used')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX site_coupon_events_coupon_idx ON site_coupon_events(coupon_id, created_at);
