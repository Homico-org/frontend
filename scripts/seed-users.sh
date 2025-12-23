#!/bin/bash

# Seed test users script
# Usage: ./seed-users.sh [dev|prod]

API_DEV="https://api.dev.homico.ge"
API_PROD="https://homico-backend.onrender.com"

ENV=${1:-prod}

if [ "$ENV" = "dev" ]; then
  API_URL=$API_DEV
elif [ "$ENV" = "prod" ]; then
  API_URL=$API_PROD
else
  echo "Usage: ./seed-users.sh [dev|prod]"
  exit 1
fi

echo "Seeding users to $ENV ($API_URL)"
echo "================================"

register_user() {
  local data="$1"
  local name=$(echo "$data" | grep -o '"name":"[^"]*"' | cut -d'"' -f4)

  response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/register" \
    -H "Content-Type: application/json; charset=utf-8" \
    -d "$data")

  http_code=$(echo "$response" | tail -1)
  body=$(echo "$response" | head -n -1)

  if [ "$http_code" = "201" ]; then
    echo "[OK] Created: $name"
  elif [ "$http_code" = "409" ]; then
    echo "[SKIP] Already exists: $name"
  else
    echo "[ERROR] Failed ($http_code): $name"
    echo "  Response: $body"
  fi

  sleep 0.5
}

echo ""
echo "--- Creating CLIENT accounts ---"

# Client 1
register_user '{"name":"Giorgi Melikishvili","email":"giorgi.melikishvili@demo.com","password":"DemoPass123","role":"client","phone":"+995591001001","city":"tbilisi"}'

# Client 2
register_user '{"name":"Nino Kvaratskhelia","email":"nino.kvaratskhelia@demo.com","password":"DemoPass123","role":"client","phone":"+995591001002","city":"tbilisi"}'

# Client 3
register_user '{"name":"Davit Beridze","email":"davit.beridze@demo.com","password":"DemoPass123","role":"client","phone":"+995591001003","city":"batumi"}'

# Client 4
register_user '{"name":"Mariam Janelidze","email":"mariam.janelidze@demo.com","password":"DemoPass123","role":"client","phone":"+995591001004","city":"kutaisi"}'

# Client 5
register_user '{"name":"Alex Gogiashvili","email":"alex.gogiashvili@demo.com","password":"DemoPass123","role":"client","phone":"+995591001005","city":"tbilisi"}'

echo ""
echo "--- Creating PRO accounts ---"

# Pro 1 - Renovation specialist
register_user '{"name":"Levan Nikoladze","email":"levan.nikoladze@demo.com","password":"DemoPass123","role":"pro","phone":"+995591002001","city":"tbilisi","selectedCategories":["renovation"],"selectedSubcategories":["full-renovation","cosmetic-repair"],"accountType":"individual"}'

# Pro 2 - Interior Designer
register_user '{"name":"Tamar Tsuladze","email":"tamar.tsuladze@demo.com","password":"DemoPass123","role":"pro","phone":"+995591002002","city":"tbilisi","selectedCategories":["design"],"selectedSubcategories":["interior","3d-visualization"],"accountType":"individual"}'

# Pro 3 - Architect
register_user '{"name":"Zurab Kharaishvili","email":"zurab.kharaishvili@demo.com","password":"DemoPass123","role":"pro","phone":"+995591002003","city":"tbilisi","selectedCategories":["architecture"],"selectedSubcategories":["residential-architecture","project-documentation"],"accountType":"individual"}'

# Pro 4 - Landscape Designer
register_user '{"name":"Elene Mamulashvili","email":"elene.mamulashvili@demo.com","password":"DemoPass123","role":"pro","phone":"+995591002004","city":"batumi","selectedCategories":["design"],"selectedSubcategories":["exterior","landscape-design"],"accountType":"individual"}'

# Pro 5 - Company
register_user '{"name":"Gremit Georgia","email":"gremit.georgia@demo.com","password":"DemoPass123","role":"pro","phone":"+995591002005","city":"tbilisi","selectedCategories":["renovation","services"],"selectedSubcategories":["full-renovation","electrical-works","plumbing"],"accountType":"organization","companyName":"Gremit Georgia"}'

# Pro 6 - Electrician
register_user '{"name":"Nika Gelashvili","email":"nika.gelashvili@demo.com","password":"DemoPass123","role":"pro","phone":"+995591002006","city":"tbilisi","selectedCategories":["services"],"selectedSubcategories":["electrical-works","smart-home"],"accountType":"individual"}'

# Pro 7 - Kitchen/Bathroom specialist
register_user '{"name":"Sandro Kutateladze","email":"sandro.kutateladze@demo.com","password":"DemoPass123","role":"pro","phone":"+995591002007","city":"kutaisi","selectedCategories":["renovation"],"selectedSubcategories":["kitchen-renovation","bathroom-renovation"],"accountType":"individual"}'

# Pro 8 - Design Studio
register_user '{"name":"Design Studio Oasis","email":"design.oasis@demo.com","password":"DemoPass123","role":"pro","phone":"+995591002008","city":"tbilisi","selectedCategories":["design","architecture"],"selectedSubcategories":["interior","3d-visualization","residential-architecture"],"accountType":"organization","companyName":"Design Studio Oasis"}'

# Pro 9 - Plumber
register_user '{"name":"Beka Lomidze","email":"beka.lomidze@demo.com","password":"DemoPass123","role":"pro","phone":"+995591002009","city":"tbilisi","selectedCategories":["services"],"selectedSubcategories":["plumbing","heating-cooling"],"accountType":"individual"}'

# Pro 10 - Furniture Designer
register_user '{"name":"Ana Chkheidze","email":"ana.chkheidze@demo.com","password":"DemoPass123","role":"pro","phone":"+995591002010","city":"tbilisi","selectedCategories":["design"],"selectedSubcategories":["furniture-design","interior"],"accountType":"individual"}'

echo ""
echo "================================"
echo "Done! Demo accounts can be accessed via /auth/demo-accounts"
echo "All demo passwords: DemoPass123"
