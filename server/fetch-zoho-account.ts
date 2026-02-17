
import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env file
dotenv.config({ path: path.resolve(__dirname, '.env') });

async function getZohoAccountId() {
    const region = process.env.ZOHO_REGION || 'in';
    const clientId = process.env.ZOHO_CLIENT_ID;
    const clientSecret = process.env.ZOHO_CLIENT_SECRET;
    const refreshToken = process.env.ZOHO_REFRESH_TOKEN;
    const fromEmail = process.env.FROM_EMAIL || 'cockpit@ripun.site';

    console.log(`Region: ${region}`);
    console.log(`Checking accounts for: ${fromEmail}`);

    if (!clientId || !clientSecret || !refreshToken) {
        console.error('Missing Zoho credentials in .env');
        return;
    }

    console.log('Fetching Access Token...');
    const tokenUrl = `https://accounts.zoho.${region}/oauth/v2/token`;

    try {
        const params = new URLSearchParams();
        params.append('refresh_token', refreshToken);
        params.append('client_id', clientId);
        params.append('client_secret', clientSecret);
        params.append('grant_type', 'refresh_token');

        const tokenResponse = await axios.post(tokenUrl, params);

        if (tokenResponse.data.error) {
            console.error('Error fetching token:', tokenResponse.data);
            return;
        }

        const accessToken = tokenResponse.data.access_token;
        console.log('Access Token acquired.');

        // Attempt 1: List Accounts (Expected to fail if scope is missing)
        console.log('Attempting to fetch Account ID via API...');
        const accountsUrl = `https://mail.zoho.${region}/api/accounts`;

        try {
            const accountsResponse = await axios.get(accountsUrl, {
                headers: { 'Authorization': `Zoho-oauthtoken ${accessToken}` }
            });

            if (accountsResponse.data && accountsResponse.data.data) {
                const firstAccount = accountsResponse.data.data[0];
                if (firstAccount) {
                    console.log(`SUCCESS: Found Account ID: ${firstAccount.accountId}`);
                    console.log(`Please set ZOHO_ACCOUNT_ID=${firstAccount.accountId} in your .env file.`);
                    return;
                }
            }
        } catch (accountError: any) {
            console.log('Listing accounts failed (likely scope issue).');
            // Expected failure if only ZohoMail.messages.CREATE scope is present
        }

        // Attempt 2: Try using email address as Account ID
        console.log(`Attempting to use email address '${fromEmail}' as Account ID...`);
        // We test this by trying to list folders for this "account ID"
        // Note: folders scope might also be missing, but let's try.
        // Actually, if we only have messages.CREATE, we can't reliably test this without sending a message.
        // But let's try to verify if the alias is accepted.

        // If listing accounts failed, likely we need to ask user to regenerate unless email works.
        // Let's assume user needs to regenerate for now, because usually accountId is numeric.

        console.log('\n❌ FAILED TO RETRIEVE ACCOUNT ID.');
        console.log('Reason: The generated token likely lacks "ZohoMail.accounts.READ" scope.');
        console.log('\nACTION REQUIRED:');
        console.log('Please regenerate your Refresh Token with the following URL (includes both scopes):');
        console.log(`https://accounts.zoho.${region}/oauth/v2/auth?scope=ZohoMail.messages.CREATE,ZohoMail.accounts.READ&client_id=${clientId}&response_type=code&access_type=offline&redirect_uri=https://cognode.ripun.site/zoho/callback`);
        console.log('\nThen run the curl command to get the new refresh token.');

    } catch (error: any) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

getZohoAccountId();
