# Auto Gen With OpenAI

## Overview

This is a wrapper for OpenAI's API that makes it easier to use.

## Features

1. **API Data Logging**: Stores the raw input and output data of the API in `history`.
2. **Billing History**: Writes the billing history to `history.log`.
3. **Agent and Step**: Allows you to create a class for agents that consist of multiple steps.
4. **Batch/Online**: Provides batch processing functionality and a REST API server.

## Directory Structure

```markdown

├── README.md
├── history (where communication logs accumulate, useful for error investigation, etc.)
│   ├── ...
│   └── ...
├── history.log (billing history)
├── package.json
├── prompts_and_responses (where prompts and results are stored)
│   ├── (agent name)/ (each agent has its own directory)
│   │   ├── ...
│   │   └── ...
│   └── ...
│       ├── ...
│       └── ...
├── results
├── src (source code)
│   └── app
│       ├── agent
│       │   ├── company-report-from-logos (agent definition)
│       │   │   ├── README.md
│       │   │   └── runner.ts
│       │   └── sample (agent definition)
│       │       └── runner.ts
│       ├── cli.ts
│       ├── common (common functionalities)
│       │   ├── base-step.ts
│       │   ├── fss.ts
│       │   ├── openai-api-wrapper.ts
│       │   └── utils.ts
│       └── main (main execution)
│           ├── main-batch.ts
│           ├── main-generate.ts
│           ├── main-server.ts
│           └── main-vision-plain.ts
└── tsconfig.json

```

## Usage

### Prerequisites

```bash
# Set up proxy (if necessary)
export https_proxy="http://${username}:${password}@${proxyHost}:${proxyPort}"

# Set up OpenAI API key
export OPENAI_API_KEY="${YOUR_OPENAI_API_KEY}"

# Install required libraries
npm install
```

### CLI

Refer to the help for instructions on how to use the CLI.

```bash
# Help
npm run cli --help
```

To install the command:

```bash
# Install for oaw user only
npm link oaw

# Install globally for oaw
npm link 
```

### Batch Usage

```bash
# Replace <sample> with the agent name.
# Choose the directory name under src/app/agent as the agent name.
npm run batch sample
```

The results will accumulate in `prompts_and_responses`, so it's a good idea to check the contents to see the progress. .tmp files are being created.

The raw data of the communication will accumulate in `history/`, which can be used for error analysis.
`history.log` contains the billing history.

## Creating an Agent

```bash
# Specify the agent name as agentName
npm run generate <agentName>
```

A template named `runner.ts` will be created under `src/app/agent/${agentName}`, so you can use that as a starting point.
※The template comments provide details on how to use it.
