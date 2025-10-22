# Turnstile Error Codes Reference

**Complete error code reference with troubleshooting**

**Official Docs**: https://developers.cloudflare.com/turnstile/troubleshooting/client-side-errors/error-codes/

---

## Error Code Families

Error codes use the format `XXXYYY` where:
- `XXX` = Error family (indicates general category)
- `YYY` = Specific error (internal use, often marked `***` in docs)

**Note**: When `***` appears, the last 3 digits can be ignored.

---

## 100*** - Initialization Problems

**Error**: Problem initializing Turnstile before challenge could start

**Retry**: No

**Cause**: Usually caused by:
- Old instance of solved challenge still present
- Page state corruption
- Cache issues

**Solution**:
1. Reload the page
2. Clear browser cache
3. Reset Turnstile widget programmatically
4. On continuous failures → likely automated device

---

## 102***, 103***, 104***, 106*** - Invalid Parameters

**Error**: Visitor sent invalid parameter as part of challenge

**Retry**: Yes

**Cause**:
- Malformed request data
- Corrupted challenge parameters
- Browser/extension interference

**Solution**:
1. Retry the challenge automatically
2. On continuous failures → likely bot
3. Implement `error-callback` with retry logic
4. Verify visitor authenticity by other means

---

## 105*** - API Compatibility

**Error**: Turnstile invoked in deprecated or invalid way

**Retry**: No

**Cause**:
- Using outdated API methods
- Invalid widget configuration
- Script version mismatch

**Solution**:
1. Check official Turnstile documentation
2. Refresh page to get latest script version
3. Review widget initialization code
4. Ensure `api.js` loads from Cloudflare CDN

---

## 110100, 110110 - Invalid Sitekey

**Error**: Turnstile invoked with invalid or inactive sitekey

**Retry**: No

**Cause**:
- Sitekey doesn't exist
- Sitekey was deleted
- Typo in sitekey
- Using wrong sitekey for environment

**Solution**:
1. Verify sitekey in Cloudflare Dashboard
2. Check sitekey is still active
3. Ensure no typos in configuration
4. Use correct sitekey for environment (dev/prod)

**Example**:
```typescript
// ❌ Wrong
const SITE_KEY = '1x00000000000000000000AA' // Test key in production

// ✅ Correct
const SITE_KEY = process.env.TURNSTILE_SITE_KEY
```

---

## 110200 - Unknown Domain

**Error**: Domain not allowed for this widget

**Retry**: No

**Cause**:
- Current hostname not in widget's allowed domains list
- Using production widget on localhost
- Subdomain not added to allowlist

**Solution**:
1. Add domain to allowed list in Cloudflare Dashboard
2. For localhost: add `localhost` or use test sitekey `1x00000000000000000000AA`
3. Check subdomain matches exactly (www.example.com ≠ example.com)

**Example Allowed Domains**:
```
example.com
www.example.com
localhost        # For development
127.0.0.1        # For development
```

---

## 110420 - Invalid Action

**Error**: Unsupported or incorrectly formatted action submitted

**Retry**: No

**Cause**:
- Action contains invalid characters
- Action exceeds 32 character limit
- Non-alphanumeric characters (except `-` and `_`)

**Solution**:
1. Use only `a-z`, `A-Z`, `0-9`, `-`, `_`
2. Keep action ≤ 32 characters
3. Example valid actions: `login`, `signup`, `contact-form`

**Reference**: https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/#configurations

---

## 110430 - Invalid cData

**Error**: Custom data (cData) format invalid

**Retry**: No

**Cause**:
- cData contains invalid characters
- cData exceeds 255 character limit

**Solution**:
1. Keep cData ≤ 255 characters
2. Use JSON.stringify() for objects
3. Validate data before passing to Turnstile

**Example**:
```typescript
// ❌ Wrong - too long
const cdata = JSON.stringify({ /* 300+ chars */ })

// ✅ Correct
const cdata = JSON.stringify({ userId: '123', sessionId: 'abc' })
```

---

## 110500 - Unsupported Browser

**Error**: Visitor using unsupported browser

**Retry**: No

**Cause**:
- Internet Explorer (not supported)
- Very outdated browser version
- Browser without required APIs

**Solution**:
1. Encourage visitor to upgrade browser
2. Provide alternative verification method
3. Display browser upgrade message

**Supported Browsers**: https://developers.cloudflare.com/cloudflare-challenges/reference/supported-browsers/

---

## 110510 - Inconsistent User-Agent

**Error**: Visitor provided inconsistent user-agent during challenge

**Retry**: No

**Cause**:
- Browser extensions spoofing user-agent
- Privacy tools modifying headers
- Browser settings

**Solution**:
1. Ask visitor to disable user-agent spoofing extensions
2. Disable privacy tools temporarily
3. Try different browser

---

## 11060* - Challenge Timed Out

**Error**: Visitor took too long to solve challenge

**Retry**: Yes

**Cause**:
- Slow network connection
- System clock set incorrectly
- Visitor distracted/inactive

**Solution**:
1. Retry the challenge
2. Check system clock is correct
3. Improve network connection

---

## 11062* - Interactive Challenge Timeout

**Error**: Visitor didn't interact with checkbox (visible mode only)

**Retry**: Yes

**Cause**:
- Challenge became outdated while waiting for interaction
- User abandoned form
- Long delays between rendering and submission

**Solution**:
1. Reset widget programmatically
2. Re-initialize widget
3. Prompt user to interact

**Example**:
```typescript
{
  'timeout-callback': () => {
    turnstile.reset(widgetId)
    alert('Please complete the verification')
  }
}
```

---

## 120*** - Internal Cloudflare Errors

**Error**: Internal debugging errors (Cloudflare employees only)

**Retry**: N/A

**Solution**: Only encountered by Cloudflare Support during debugging.

---

## 200010 - Invalid Caching

**Error**: Some portion of Turnstile was accidentally cached

**Retry**: No

**Cause**:
- Browser cached Turnstile resources incorrectly
- CDN/proxy caching `api.js` script

**Solution**:
1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. Ensure `api.js` is not proxied or cached

**CRITICAL**: Never proxy or cache `https://challenges.cloudflare.com/turnstile/v0/api.js`

---

## 200100 - Time Problem

**Error**: Visitor's system clock is incorrect

**Retry**: No

**Cause**:
- System time is wrong
- Timezone misconfigured
- Date/time not synchronized

**Solution**:
1. Set system clock to correct time
2. Enable automatic time synchronization
3. Check timezone settings

---

## 200500 - Loading Error

**Error**: iframe under challenges.cloudflare.com could not be loaded

**Retry**: No

**Cause**:
- **Content Security Policy (CSP) blocking iframe**
- Browser security settings blocking 3rd-party iframes
- Network firewall blocking challenges.cloudflare.com

**Solution**:
1. **Add CSP directives**:
   ```html
   <meta http-equiv="Content-Security-Policy" content="
     script-src 'self' https://challenges.cloudflare.com;
     frame-src 'self' https://challenges.cloudflare.com;
     connect-src 'self' https://challenges.cloudflare.com;
   ">
   ```
2. Reduce browser security preferences
3. Check firewall/network settings

**Most Common Cause**: CSP blocking. See check-csp.sh script.

---

## 300*** - Generic Client Execution Error

**Error**: Unspecified error occurred while visitor solved challenge

**Retry**: Yes

**Cause**:
- Browser extension interference
- JavaScript errors on page
- Memory issues
- Network interruption

**Solution**:
1. Retry automatically
2. On continuous failures → potentially automated visitor
3. Disable browser extensions
4. Try incognito/private mode

**Known Issue (2025)**: Safari 18 + macOS 15 with "Hide IP" enabled causes Error 300010.

**Safari Fix**: Settings → Privacy → Hide IP address → Off

**Source**: https://community.cloudflare.com/t/turnstile-is-frequently-generating-300x-errors/700903

---

## 300030 - Widget Crash

**Error**: Widget crashed for legitimate users

**Retry**: Yes

**Cause**: Unknown - Cloudflare-side issue (2025)

**Solution**:
1. Implement robust error handling
2. Retry with exponential backoff
3. Provide fallback verification method

**Example**:
```typescript
let retryCount = 0
const maxRetries = 3

turnstile.render('#container', {
  sitekey: SITE_KEY,
  'error-callback': (error) => {
    if (error.includes('300030') && retryCount < maxRetries) {
      retryCount++
      setTimeout(() => {
        turnstile.reset(widgetId)
      }, 2000 * retryCount) // Exponential backoff
    } else {
      showFallbackVerification()
    }
  }
})
```

**Source**: https://community.cloudflare.com/t/turnstile-is-frequently-generating-300x-errors/700903

---

## 400020 - Invalid Sitekey (Server)

**Error**: Sitekey is invalid or does not exist

**Retry**: No

**Cause**: Same as 110100/110110 but caught server-side

**Solution**: Verify sitekey exists and is active

---

## 400030 - Invalid Size

**Error**: Provided size option is not valid

**Retry**: No

**Cause**: Using invalid `size` parameter

**Valid Options**: `normal`, `compact`, `flexible`

**Solution**:
```typescript
// ❌ Wrong
{ size: 'large' }

// ✅ Correct
{ size: 'compact' }
```

---

## 400040 - Invalid Theme

**Error**: Provided theme is not valid

**Retry**: No

**Cause**: Using invalid `theme` parameter

**Valid Options**: `light`, `dark`, `auto`

**Solution**:
```typescript
// ❌ Wrong
{ theme: 'custom' }

// ✅ Correct
{ theme: 'dark' }
```

---

## 401 - Unauthorized (Expected)

**Error**: 401 error in browser console during challenge

**Retry**: N/A

**Cause**: Turnstile requesting Private Access Token (not supported by all devices/browsers)

**Solution**: **Ignore this error** - it's expected behavior

**Note**: If widget is successfully resolving and generating tokens, no action required.

**Source**: https://developers.cloudflare.com/turnstile/troubleshooting/client-side-errors/error-codes/

---

## 600*** - Challenge Execution Failure

**Error**: Visitor failed to solve Turnstile challenge

**Retry**: Yes

**Cause**:
- Suspected bot behavior
- Challenge signals indicate automation
- Failing test sitekey (intentional)

**Solution**:
1. Retry automatically
2. On continuous failures → likely bot
3. Verify visitor by other means
4. Consider alternative verification

**Testing**: Test sitekey `2x00000000000000000000AB` always fails with this error.

---

## 600010 - Configuration Error

**Error**: Widget configuration error

**Retry**: Depends

**Cause**:
- **Missing hostname in allowlist** (most common)
- Hostname was deleted from configuration
- Widget misconfigured

**Solution**:
1. Check Cloudflare Dashboard → Turnstile → Widget Settings
2. Verify hostname in allowed domains
3. Re-add hostname if missing

**Known Issue**: Hostnames sometimes disappear from dashboard configuration

**Source**: https://community.cloudflare.com/t/repeated-cloudflare-turnstile-error-600010/644578

---

## Browser-Specific Issues

### Brave Browser - Confetti Animation Failure (2025)

**Error**: Verification fails during success animation

**Cause**: Brave shields block animation scripts

**Solution**: Handle success callback before animation completes

**Source**: https://github.com/brave/brave-browser/issues/45608

---

## Troubleshooting Checklist

When encountering errors:

1. **Check Error Code Family**
   - 100*: Initialization → Reload page
   - 110*: Configuration → Check sitekey, domain allowlist
   - 200*: Client issues → Check cache, CSP, system clock
   - 300*: Execution → Retry, check browser compatibility
   - 400*: Invalid input → Fix configuration
   - 600*: Challenge failure → Check for bot-like behavior

2. **Common Fixes**
   - Clear browser cache
   - Disable browser extensions
   - Try incognito/private mode
   - Check CSP headers
   - Verify system clock
   - Use test sitekey for development

3. **Network/Firewall**
   - Ensure `challenges.cloudflare.com` is accessible
   - Check for VPN/proxy interference
   - Verify no firewall blocking

4. **Code Review**
   - Server-side validation implemented?
   - Token expiration handled?
   - Error callbacks configured?
   - Using latest `api.js` from CDN?

---

**Last Updated**: 2025-10-22
**Most Common Errors**: 110200 (domain), 200500 (CSP), 300030 (crash), 600010 (config)
