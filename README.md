# auto-gen-for-angular

This program generates Angular screens using ChatGPT's API.

This program is mainly intended for business systems. It can automatically generate about 20 to 30 components.

It is not a stand-alone agent like AutoGPT, but a task runner that only executes predefined tasks.

It does not have an error correction function (cost explosion), so it only generates a batch of sample programs and is not at the level where you can use the generated products as they are.


## How to run
It is assumed that the environment can use OpenAI's API.

If you write a user scenario of the system you want to create with the file name "000-requirements.md" in the same hierarchy as the source, and then run it, you will get an Angular screen set.
To run it, simply run src/main.ts.

```bash
# Install libraries
npm install
# Run
ts-node src/main.ts
```


## cost
The cost of the sample 000-requirements.md was about 300,000 tokens, or about $0.4 yen.

If you use GPT-4 for all source generators, it costs about $6.


## Usage 
The bottom of the generator.js file is where the steps are executed,

Create a prompt with ``initPrompt'' and run it with ``run''.

```javascript
  obj = new Step000_RequirementsToComponentList();
  obj.initPrompt();
  await obj.run(); obj.run()
```

It will generally work in a single step, but I often comment out all the steps except the one I want to run.
Especially after STEP12, some things will be executed a lot, so I use initPrompt to see how the prompt looks like, then run some of them in Playground, and if the results look good, I run run run.

## What can I do?
This article briefly summarizes it.
> https://qiita.com/Programmer-cbl/items/7980e9c3085a8ce2aaf9

If you make the modifications manually, it will look something like this It takes roughly 3 hours of labor.
> https://bank-crm-v1-mock.s3.ap-northeast-1.amazonaws.com/index.html
