#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AuthirizationServiceStack } from '../lib/authorizer-stack';

const app = new cdk.App();

new AuthirizationServiceStack(app, 'AuthorizerStack', {});

app.synth();