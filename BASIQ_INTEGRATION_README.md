# Basiq Open Banking Integration

Complete Basiq integration for Budgetier - allowing users to securely connect their bank accounts and automatically import transactions.

## Overview

This integration enables:
- Secure bank account connections via Basiq Open Banking
- Automatic transaction import (income & expenses)
- Scheduled sync every 6 hours
- Smart categorization of transactions
- Full integration with gamification systems (Treasure Chest, Ship Health)

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   Backend API    │────▶│   Basiq API     │
│   React App     │     │   Express.js     │     │   Open Banking  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │   PostgreSQL     │
                       │   Database       │
                       └──────────────────┘
```

## New Components

### Backend

| File | Purpose |
|------|---------|
| `backend/src/models/basiq.js` | Basiq service layer - authentication, user management, transaction fetching |
| `backend/src/routes/banking.js` | API endpoints for bank connections and syncing |
| `backend/src/services/syncScheduler.js` | Automatic sync scheduler (runs every 6 hours) |

### Frontend

| File | Purpose |
|------|---------|
| `frontend/src/pages/BankConnection.js` | Bank connection management page |
| `frontend/src/components/BankConnectionStatus.js` | Dashboard widget showing connection status |

### Database Tables

| Table | Purpose |
|-------|---------|
| `bank_connections` | Stores Basiq user/connection mappings and status |
| `basiq_transactions` | Raw imported transactions from Basiq |
| `expenses.basiq_transaction_id` | Links expenses to Basiq transactions |
| `income.basiq_transaction_id` | Links income to Basiq transactions |

## API Endpoints

### Banking Routes (`/api/banking`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/status` | Get bank connection status |
| POST | `/connect` | Create Basiq connect link |
| GET | `/callback` | Handle Basiq OAuth callback |
| POST | `/disconnect` | Disconnect bank account |
| GET | `/connections` | List all bank connections |
| POST | `/sync` | Manually trigger transaction sync |
| GET | `/transactions` | Get recently imported transactions |
| GET | `/sync-status` | Get detailed sync status |

## Environment Variables

```env
# Required for Basiq integration
BASIQ_API_KEY=your_basiq_api_key_here
BASIQ_API_URL=https://au-api.basiq.io

# Optional - sync interval (default: every 6 hours)
SYNC_INTERVAL=0 */6 * * *
```

## User Flow

1. **User clicks "Connect Bank"** on Banking page
2. **Backend creates Basiq user** (if not exists) and generates connect link
3. **User is redirected** to Basiq's secure consent flow
4. **User authenticates** with their bank credentials (directly with Basiq)
5. **Basiq redirects** back to our callback URL with connection ID
6. **Backend validates** the connection and fetches initial transactions
7. **Gamification rewards** are given (+50 XP, +25 Gold for connecting)
8. **Auto-sync begins** - new transactions imported every 6 hours

## Security Features

- ✅ **Bank-grade encryption** - All API calls use HTTPS
- ✅ **No credential storage** - We never store bank login credentials
- ✅ **Read-only access** - Cannot move money or make payments
- ✅ **Token-based auth** - Basiq access tokens expire after 60 minutes
- ✅ **User consent** - Privacy modal explains data usage before connection
- ✅ **One-click disconnect** - Users can revoke access at any time
- ✅ **Row-level security** - Users can only access their own transaction data

## Transaction Processing

### Import Logic

```javascript
// Basiq transactions are processed as follows:
debit transactions  →  expenses (money going out)
credit transactions →  income (money coming in)
```

### Duplicate Prevention

- Uses `basiq_transaction_id` as unique identifier
- Upsert logic prevents duplicate entries
- Idempotent sync operations

### Category Mapping

Basiq categories are mapped to Budgetier categories:

| Basiq Category | Budgetier Category |
|----------------|-------------------|
| restaurants, groceries, food | Food & Dining |
| transport, fuel, taxi | Transportation |
| rent, mortgage | Housing |
| utilities, electricity, gas | Utilities |
| entertainment | Entertainment |
| shopping, clothing | Shopping |
| health, medical | Health |
| education | Education |
| salary | Salary |

## Gamification Integration

When transactions are imported:

1. **Treasure Chest** - Automatically recalculates savings (income - expenses)
2. **Ship Health** - Updates based on spending ratio vs budget
3. **XP Rewards** - +5 XP for each manual sync
4. **Achievement** - First bank connection awards +50 XP, +25 Gold

## Scheduled Sync

The `syncScheduler.js` service runs automatically:

- **Schedule**: Every 6 hours (configurable via `SYNC_INTERVAL`)
- **Batch size**: 500 transactions per sync
- **Lookback**: Since last successful sync (max 90 days on first sync)
- **Error handling**: Failed users don't block others; errors logged per user

## Error Handling

### Connection Errors
- Expired tokens → Automatic refresh
- Invalid credentials → User prompted to reconnect
- Rate limits → Exponential backoff retry

### Sync Errors
- Per-user error tracking in `bank_connections.last_sync_error`
- Failed syncs don't affect other users
- Dashboard widget shows error status with retry option

## Testing

### Manual Testing Checklist

1. [ ] User can connect bank account
2. [ ] Transactions are imported correctly
3. [ ] No duplicates on re-sync
4. [ ] Expenses appear in Expenses page
5. [ ] Income appears in Income page
6. [ ] Treasure chest updates after import
7. [ ] Ship health updates after import
8. [ ] Disconnect removes connection
9. [ ] Privacy modal displays before connect
10. [ ] Dashboard widget shows correct status

### API Testing

```bash
# Get status
curl /api/banking/status

# Create connect link
curl -X POST /api/banking/connect -d '{"email":"user@example.com"}'

# Sync transactions
curl -X POST /api/banking/sync

# Get imported transactions
curl /api/banking/transactions
```

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| "Basiq authentication failed" | Check `BASIQ_API_KEY` is set correctly |
| "No Basiq user found" | User needs to connect bank first |
| Sync not running automatically | Check `syncScheduler.start()` in server.js |
| Duplicate transactions | Check `basiq_transaction_id` uniqueness |

### Debug Mode

Enable detailed logging:
```javascript
// In backend/src/models/basiq.js
const DEBUG = true;
```

## Compliance

- ✅ **Consumer Data Right (CDR)** - Compliant with Australian Open Banking standards
- ✅ **GDPR** - User data can be exported and deleted
- ✅ **Privacy Act** - Clear privacy notice before connection
- ✅ **SSL/TLS** - All communications encrypted

## Future Enhancements

- [ ] Multiple bank account support per user
- [ ] Real-time webhooks for instant transaction updates
- [ ] AI-powered categorization improvements
- [ ] Spending insights and anomaly detection
- [ ] Budget vs actuals alerts based on bank data

## Resources

- [Basiq Documentation](https://api.basiq.io/)
- [CDR Standards](https://consumerdatastandards.gov.au/)
- [Open Banking Australia](https://www.openbanking.org.au/)

## Support

For issues with the Basiq integration:
1. Check error logs in `backend/src/models/basiq.js`
2. Verify `BASIQ_API_KEY` is valid at https://dashboard.basiq.io/
3. Check database connection and table existence
4. Review Basiq API status at https://status.basiq.io/
