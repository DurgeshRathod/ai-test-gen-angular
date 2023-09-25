# ai-test-gen-angular

**ai-test-gen-angular** is a powerful tool that leverages OpenAI's advanced capabilities to automate the generation of unit tests for your Angular components and services. This innovative package intelligently analyzes your codebase and produces comprehensive test cases, saving you time and effort in the testing process. Seamlessly integrate it into your Angular projects and watch as it enhances your development workflow by ensuring robust and reliable code.

## Key Features:

1. **Intelligent Test Generation:**
   ai-test-gen-angular intelligently generates unit tests for Angular components and services. While it provides a solid foundation, manual adjustments may be required to ensure the generated tests are executable and meet your specific needs.

2. **Time and Effort Savings:**
   Automating test creation with ai-test-gen-angular significantly reduces the time and effort spent on writing tests. However, it's important to note that some manual fine-tuning may be necessary to achieve optimal results.

3. **Enhanced Code Quality:**
   The tool offers comprehensive test coverage, helping to improve code reliability. While it's a powerful aid, developers should be aware that the generated tests may require adjustments to be fully effective.

## Usage

To get started with `ai-test-gen-angular`, follow these simple steps:

1. Install the package via npm:

```bash
npm i ai-test-gen-angular
```

2. Set Open API key in env

```bash
export OPENAI_API_KEY=somekey
```

3. Generate Unit Tests (run this command in the root folder of your project)

```bash
node ./node_modules/ai-test-gen-angular/index.js <relative/path/to/component/or/service/ts-file> <relative/path/to/ts-config-file>
```

IMPORTANT:
Please note that you need to give relative path from the project root to your component/service file and also to the tsconfig.json file. (if you have multiple tsconfig.json file, then please use that file in which you have mentioned the alias path for your subfolders)

4. Example

```bash
node ./node_modules/ai-test-gen-angular/index.js src/app/app.component.ts ./tsconfig.json
```

## Note

For better result you can store your class models, types, enum, interface in files with extension

1. .model.ts
2. .enum.ts
3. .interface.ts
4. reading for files which are exported from a index.ts is currently not supported

Please be aware that the generated file will not be directly executable but hopefully it generates a code snippet to lessen the effort of the developer. In some cases, the file may contain superfluous or absent characters at its start or end. In such cases, it may be necessary to perform manual adjustments. This is a natural aspect of utilizing generative AI technology.
