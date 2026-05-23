# Cospend Manager - Usage Guide

## Quick Start

### 1. Get Your Cospend Public Link

To use this app, you need a **public Cospend link** from your Nextcloud instance.

#### Steps to get the link:
1. Open your Nextcloud instance
2. Navigate to Cospend app
3. Open your project
4. Click on **Settings** (gear icon)
5. Enable **Public link** or **Share project**
6. Copy the generated link

The link format should be:
```
cospend://[host]/[token]/[password]
```

Example:
```
cospend://cloud.paucar.eu/eRGAMRfsMWLtWeEx9qeHW8wZXzBKWBFCKZTMzjrA2E8zgDmpSwZmH5ZjmmW7YntT/no-pass
```

### 2. Connect the App

1. Open the Cospend Manager app
2. Paste your Cospend link in the input field
3. Click **Connect**
4. The app will verify the connection and save it locally

## Using the App

### Dashboard (Home)
- View total expenses
- See number of bills
- Check active members count
- View each member's balance (positive = owed money, negative = owes money)
- See settlement transactions

### Members
- Browse all project members
- See active and inactive members
- View member details (ID, weight, color)
- Note: Adding/editing members requires authenticated Nextcloud access

### Add Bill
Fast and easy bill creation:

1. Enter the **amount** (in project currency)
2. Add a **description** (e.g., "Dinner at restaurant")
3. Add optional **comment** for details
4. Select **who paid**
5. Choose participants:
   - Toggle "Split between all active members" for everyone
   - Or manually select specific members
6. Optionally select **category** and **payment mode**
7. Click **Add Bill**

The bill is created with the current timestamp.

### Bills
- Browse all bills sorted by date (newest first)
- Search bills by:
  - Description
  - Payer name
  - Amount
  - Comment
- View bill details:
  - Who paid
  - Amount
  - Participants
  - Date
  - Comments
- Delete bills with confirmation

### Settlement
View simplified debt settlement:

- **Payment Plan**: Optimized transactions showing who should pay whom
- **Individual Balances**: Each member's net balance
  - Green (positive) = is owed money
  - Red (negative) = owes money
  - Neutral = settled up

## Tips

### Refresh Data
Each screen has a refresh button (↻ icon) in the top right to reload the latest data.

### Mobile Usage
The app is optimized for mobile:
- Large touch targets
- Bottom navigation for easy thumb access
- Swipe-friendly interface
- Works offline for viewing cached data

### Data Storage
- Your Cospend link is stored in browser localStorage
- No third-party servers involved
- All API calls go directly to your Nextcloud instance
- Clear data by clicking "Disconnect Project" in Settings

### Bill Creation Best Practices
1. Use descriptive names ("Groceries at Walmart" vs "Food")
2. Add comments for unusual splits or details
3. Select the correct payer (defaults to first member)
4. Use categories for better expense tracking
5. Double-check the amount before submitting

### Settlement
The settlement plan shows the **minimum number of transactions** needed to settle all debts. For example, if:
- Alice owes $20
- Bob is owed $10
- Carol is owed $10

Instead of Alice paying both Bob and Carol separately, the app shows just one transaction from Alice to Bob for the simplified amount.

## Troubleshooting

### "Failed to connect"
- Verify your Cospend link format is correct
- Check that public sharing is enabled in Nextcloud
- Ensure your Nextcloud instance is accessible
- Check your internet connection

### "Failed to load data"
- Tap the refresh button
- Check your internet connection
- Verify the project still exists and is shared

### Bills not showing author
This is normal for public API access. Bills created through the public API won't show an author because the app isn't logged in as a Nextcloud user. The payer information is still correctly stored.

### Can't create/edit members
Member management requires authenticated Nextcloud access and is not available through the public API.

## Privacy & Security

- Your data stays between your device and your Nextcloud instance
- No analytics or tracking
- Connection details stored only in your browser
- Use HTTPS for secure communication (automatically enforced)
- Consider using password-protected Cospend links for better security

## API Information

For developers interested in the API integration:

**Base URL Pattern:**
```
https://{host}/ocs/v2.php/apps/cospend/api/v1/public/projects/{token}/{password}
```

**Required Headers:**
```
Accept: application/json
Content-Type: application/json
OCS-APIRequest: true
```

**Supported Operations:**
- GET project details, bills, members, statistics, settlement
- POST new bills
- DELETE bills

See README.md for detailed API documentation.
