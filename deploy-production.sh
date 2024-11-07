cd backend/lambda
npm i
npm run recodegen
npm run build
cd ../../
sam package --s3-bucket sam-s3-bucket-for-lambda2 --output-template-file packaged.yaml
sam deploy --config-file samconfig.production.toml --no-fail-on-empty-changeset --force-upload