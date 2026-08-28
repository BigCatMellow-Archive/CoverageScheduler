# Deploy the Web App

Coverage Scheduler includes a full-screen interface served by Google Apps Script.

The web app is what most users should bookmark and use day to day.

Before deploying, complete [Workbook Setup](Workbook-Setup.md). The setup command stores the workbook connection privately in Apps Script Script Properties so the web app knows which spreadsheet to use.

## Step 1 — Open Apps Script

From the Coverage Scheduler spreadsheet, choose:

**Extensions → Apps Script**

## Step 2 — Start a deployment

In the upper-right corner of Apps Script:

1. Click **Deploy**.
2. Click **New deployment**.
3. Next to **Select type**, click the deployment-type/settings icon.
4. Choose **Web app**.

Google's official web-app documentation describes the same deployment flow:

https://developers.google.com/apps-script/guides/web

## Step 3 — Choose deployment settings

You will see options for who the web app executes as and who may access it.

For a school-owned internal tool, use the access level permitted by your Google Workspace administrator and your school's policy.

A common setup is to execute the app as the account that owns the scheduler so the app can read and write the scheduler workbook. Do not grant broader access than your organization needs.

The exact access choices available can differ between personal Google accounts and managed Google Workspace accounts.

## Step 4 — Deploy

Click **Deploy**.

Google may ask you to authorize the project. Complete the permission prompts.

After deployment, Google displays a **Web app URL**.

The production URL normally ends in:

```text
/exec
```

Copy that URL and bookmark it.

## `/exec` versus `/dev`

Apps Script can also provide a test URL ending in `/dev`.

Use `/dev` only while testing from an account that can edit the script. It follows the latest saved code.

Use the versioned `/exec` deployment for normal users.

## Very important — code changes do not automatically update an old production deployment

If you copy newer Coverage Scheduler code into Apps Script, saving the files is not enough to update an existing `/exec` URL.

Update the deployment:

1. Open Apps Script.
2. Click **Deploy → Manage deployments**.
3. Select the existing web-app deployment.
4. Click **Edit**.
5. Change the version to **New version**.
6. Click **Deploy**.

The deployment can keep the same public URL while pointing to the new code version.

This is one of the first things to check when the editor contains a fix but the web app still behaves like the old version.

Google's deployment documentation is here:

https://developers.google.com/apps-script/concepts/deployments

## First launch

Open the `/exec` URL.

The interface should show:

- date selector at the top;
- absent staff panel on the left;
- coverage plan in the center;
- coverage staff on the right.

If it reports that Coverage Scheduler is not connected to a workbook, return to the spreadsheet and run:

**Coverage Scheduler → Set up workbook**

Then reload the web app.

If you receive a 404 or another startup error, see [Troubleshooting](Troubleshooting.md).
