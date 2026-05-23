# Cospend Manager

A mobile-first Progressive Web App (PWA) for managing shared expenses using the Cospend/Nextcloud public API.

## Features

- 📱 Mobile-first responsive design
- 💰 Track shared expenses and bills
- 👥 View project members and balances
- 📊 See settlement plans (who owes whom)
- ➕ Easy bill creation with participant selection
- 🔄 Real-time balance calculations
- 💾 Offline-capable (cached viewing)
- 🌐 Works with Cospend public API links

## Getting Started

### Connect to a Cospend Project

1. Get your Cospend public link in the format:
   ```
   cospend://host/token/password
   ```
   Example:
   ```
   cospend://cloud.paucar.eu/eRGAMRfsMWLtWeEx9qeHW8wZXzBKWBFCKZTMzjrA2E8zgDmpSwZmH5ZjmmW7YntT/no-pass
   ```

2. Enter the link in the setup screen
3. The app will test the connection and save it locally

### Using the App

The app has 5 main sections accessible via bottom navigation:

- **Home**: Overview of total spent, bills, and member balances
- **Members**: List of all project members (active and inactive)
- **Add**: Quick bill creation with easy participant selection
- **Bills**: Browse, search, and delete bills
- **Settle**: See simplified settlement plan and individual balances

## API Details

### Base URL Format
```
https://{host}/ocs/v2.php/apps/cospend/api/v1/public/projects/{token}/{password}
```

### Required Headers
```
Accept: application/json
Content-Type: application/json
OCS-APIRequest: true
```

### Supported Endpoints

- `GET {API}` - Get project details
- `GET {API}/bills` - Get all bills
- `GET {API}/members` - Get all members
- `GET {API}/statistics` - Get spending statistics
- `GET {API}/settlement` - Get settlement plan
- `POST {API}/bills` - Create a new bill
- `DELETE {API}/bills/{billId}` - Delete a bill

### Creating Bills

When creating bills, use camelCase field names in the JSON payload:

```json
{
  "amount": 100,
  "what": "Dinner",
  "comment": "",
  "payer": 6,
  "payedFor": "6,7,8,9",
  "categoryId": 2,
  "paymentModeId": 3,
  "repeat": "n",
  "repeatAllActive": 0,
  "repeatFreq": 1,
  "repeatUntil": null,
  "timestamp": 1779531596
}
```

**Important Notes:**
- `payer` is the numeric member ID
- `payedFor` is a comma-separated string of member IDs
- Do NOT use snake_case field names (`payer_id`, `payed_for`, etc.)
- Public API entries may show as having no author because the app is not logged in as a Nextcloud user

## Tech Stack

- React 18.3
- TypeScript
- Tailwind CSS v4
- Vite
- shadcn/ui components
- Lucide icons

## Storage

The app stores your Cospend connection link in browser localStorage. No data is sent to any third-party servers - all API calls go directly to your Cospend/Nextcloud instance.

## Limitations

- Member creation/editing requires authenticated Nextcloud access (not available in public API mode)
- Some features may be limited depending on your Cospend project permissions
- Requires internet connection for API operations (cached data viewable offline)

## Development

This is a Figma Make project. The dev server is automatically running in the Figma Make environment.
