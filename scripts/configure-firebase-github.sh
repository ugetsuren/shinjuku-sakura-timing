#!/usr/bin/env bash
# Run once from an authenticated Google Cloud Shell or a trusted administrator terminal.
# This script changes Google Cloud IAM. Review docs/FIREBASE_SETUP.md before running it.
set -euo pipefail

project_id='shinjukugyoensimulate'
repository_id='1441897234'
owner_id='334442186'
pool_id='github-sakura'
provider_id='github'
account_id='sakura-hosting-deploy'
account_email="${account_id}@${project_id}.iam.gserviceaccount.com"

command -v gcloud >/dev/null || { echo 'gcloud is required. Use Google Cloud Shell.' >&2; exit 1; }
active_account=$(gcloud auth list --filter=status:ACTIVE --format='value(account)')
[[ -n "$active_account" ]] || { echo 'Sign in to Google Cloud before running this script.' >&2; exit 1; }
project_number=$(gcloud projects describe "$project_id" --format='value(projectNumber)')
[[ "$project_number" =~ ^[0-9]+$ ]] || { echo 'Cannot read project number.' >&2; exit 1; }

gcloud services enable iam.googleapis.com iamcredentials.googleapis.com sts.googleapis.com firebasehosting.googleapis.com --project="$project_id"

if ! gcloud iam service-accounts describe "$account_email" --project="$project_id" >/dev/null 2>&1; then
  gcloud iam service-accounts create "$account_id" --project="$project_id" --display-name='Shinjuku Sakura Hosting deploy'
fi
for role in roles/firebasehosting.admin roles/serviceusage.serviceUsageConsumer; do
  gcloud projects add-iam-policy-binding "$project_id" --member="serviceAccount:${account_email}" --role="$role" --condition=None --quiet
done

if ! gcloud iam workload-identity-pools describe "$pool_id" --project="$project_id" --location=global >/dev/null 2>&1; then
  gcloud iam workload-identity-pools create "$pool_id" --project="$project_id" --location=global --display-name='Shinjuku Sakura GitHub'
fi

mapping='google.subject=assertion.sub,attribute.repository_id=assertion.repository_id,attribute.repository_owner_id=assertion.repository_owner_id'
condition="assertion.repository_id == '${repository_id}' && assertion.repository_owner_id == '${owner_id}' && assertion.ref == 'refs/heads/main' && (assertion.event_name == 'push' || assertion.event_name == 'workflow_dispatch')"
if gcloud iam workload-identity-pools providers describe "$provider_id" --project="$project_id" --location=global --workload-identity-pool="$pool_id" >/dev/null 2>&1; then
  gcloud iam workload-identity-pools providers update-oidc "$provider_id" --project="$project_id" --location=global --workload-identity-pool="$pool_id" --issuer-uri='https://token.actions.githubusercontent.com' --attribute-mapping="$mapping" --attribute-condition="$condition"
else
  gcloud iam workload-identity-pools providers create-oidc "$provider_id" --project="$project_id" --location=global --workload-identity-pool="$pool_id" --issuer-uri='https://token.actions.githubusercontent.com' --attribute-mapping="$mapping" --attribute-condition="$condition"
fi

gcloud iam service-accounts add-iam-policy-binding "$account_email" --project="$project_id" --role=roles/iam.workloadIdentityUser --member="principalSet://iam.googleapis.com/projects/${project_number}/locations/global/workloadIdentityPools/${pool_id}/attribute.repository_id/${repository_id}" --quiet

printf '\nSet these GitHub Actions repository VARIABLES (not JSON keys):\n'
printf 'GCP_WORKLOAD_IDENTITY_PROVIDER=projects/%s/locations/global/workloadIdentityPools/%s/providers/%s\n' "$project_number" "$pool_id" "$provider_id"
printf 'FIREBASE_DEPLOY_SERVICE_ACCOUNT=%s\n' "$account_email"
printf '\nAllow time for IAM changes to propagate before the first deployment.\n'

