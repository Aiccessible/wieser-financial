cd backend/lambda
npm run build
cd ../../
sam package --s3-bucket sam-s3-bucket-for-lambda --output-template-file packaged.yaml
sam deploy --no-fail-on-empty-changeset --force-upload