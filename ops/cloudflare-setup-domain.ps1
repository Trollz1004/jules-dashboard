$token = "gPQMSOwXMnVAaTPeNrhwAsQQTYLijmqQ38lIRHWmBVA.ZbSFCs6y6bZ0eoJywnp3xGl5E7O8biCjS1zvRagYQUE"
$accountId = "516a3a855f44f5ad8453636d163ae25d"
$zoneId = "155fc19cd87bc1ea8989f0deb210d612"
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Write-Host "=== CLOUDFLARE PAGES DOMAIN SETUP ===" -ForegroundColor Cyan
Write-Host "Zone: youandinotai.com ($zoneId)"

# Step 1: Get current DNS records
Write-Host "`n[1] Fetching current DNS records..." -ForegroundColor Yellow
try {
    $dns = curl.exe -s -m 30 "https://api.cloudflare.com/client/v4/zones/$zoneId/dns_records" -H "Authorization: Bearer $token" | ConvertFrom-Json
    if ($dns.success) {
        Write-Host "  Found $($dns.result.Count) DNS records"
        foreach ($rec in $dns.result) {
            Write-Host "  - $($rec.type): $($rec.name) -> $($rec.content)" -ForegroundColor Gray
        }
    } else {
        Write-Host "  ERROR: $($dns.errors | ConvertTo-Json)" -ForegroundColor Red
    }
} catch {
    Write-Host "  Failed to get DNS records: $_" -ForegroundColor Red
}

# Step 2: Check if root CNAME exists for pages
Write-Host "`n[2] Checking for Pages CNAME..." -ForegroundColor Yellow
$rootCname = $dns.result | Where-Object { $_.type -eq "CNAME" -and $_.name -eq "youandinotai.com" }
if ($rootCname) {
    Write-Host "  Root CNAME exists: $($rootCname.content)" -ForegroundColor Green
} else {
    Write-Host "  No root CNAME found. Need to add one." -ForegroundColor Yellow
    
    # Add CNAME for Pages
    $body = @{
        type = "CNAME"
        name = "@"
        content = "youandinotai.pages.dev"
        proxied = $true
    } | ConvertTo-Json
    
    Write-Host "  Adding CNAME @ -> youandinotai.pages.dev..."
    $result = curl.exe -s -m 30 -X POST "https://api.cloudflare.com/client/v4/zones/$zoneId/dns_records" -H "Authorization: Bearer $token" -H "Content-Type: application/json" -d $body | ConvertFrom-Json
    if ($result.success) {
        Write-Host "  SUCCESS: CNAME added!" -ForegroundColor Green
    } else {
        Write-Host "  ERROR: $($result.errors | ConvertTo-Json)" -ForegroundColor Red
    }
}

# Step 3: Add custom domain to Pages project
Write-Host "`n[3] Adding custom domain to Pages project..." -ForegroundColor Yellow
$domainBody = @{ name = "youandinotai.com" } | ConvertTo-Json
$addDomain = curl.exe -s -m 30 -X POST "https://api.cloudflare.com/client/v4/accounts/$accountId/pages/projects/youandinotai/domains" -H "Authorization: Bearer $token" -H "Content-Type: application/json" -d $domainBody | ConvertFrom-Json
if ($addDomain.success) {
    Write-Host "  SUCCESS: Domain added to Pages project!" -ForegroundColor Green
} else {
    Write-Host "  Result: $($addDomain | ConvertTo-Json -Depth 3)" -ForegroundColor Yellow
}

Write-Host "`n=== DONE ===" -ForegroundColor Cyan
