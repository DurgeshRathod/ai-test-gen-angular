# ai-test-gen-angular

**ai-test-gen-angular** is a powerful tool that leverages OpenAI's advanced capabilities to automate the generation of unit tests for your Angular components and services. This innovative package intelligently analyzes your codebase and produces comprehensive test cases, saving you time and effort in the testing process. Seamlessly integrate it into your Angular projects and watch as it enhances your development workflow by ensuring robust and reliable code.

## Key Features

1. **Intelligent Test Generation:**
   ai-test-gen-angular intelligently generates unit tests for Angular components and services. While it provides a solid foundation, manual adjustments may be required to ensure the generated tests are executable and meet your specific needs.

2. **Time and Effort Savings:**
   Automating test creation with ai-test-gen-angular significantly reduces the time and effort spent on writing tests. However, it's important to note that some manual fine-tuning may be necessary to achieve optimal results.

3. **Enhanced Code Quality:**
   The tool offers comprehensive test coverage, helping to improve code reliability. While it's a powerful aid, developers should be aware that the generated tests may require adjustments to be fully effective.

## Setup

To get started with `ai-test-gen-angular`, follow these simple steps:

1. Install the package via npm:

```bash
npm i ai-test-gen-angular
```

2. Set Open API key in environment variable.

```bash
# if you want to use openai then do this
export OPENAI_API_KEY=somekey
```

```bash
# if you want to use aws bedrock then do this (you should use the flag --aws-bedrock while running the command)
export AWS_ACCESS_KEY=****************
export AWS_SECRET_KEY=****************
export AWS_REGION=*********
```

3. Generate Unit Tests (run this command in the root folder of your project)

```bash
node ./node_modules/ai-test-gen-angular/index.js "relative/path/to/service/or/somecomponent.component.ts" "relative/path/to/tsconfig.json" [--read-from-index-files] [--aws-bedrock]
```

IMPORTANT:
Please note that you need to give relative path from the project root

- to your component/service file
- and also to the tsconfig.json file. (if you have multiple tsconfig.json file, then please use that file in which you have mentioned the alias path for your subfolders)

## Restrict scanning for selected files

if you want to exclude some files from being scanned then you can add a comment at the top of that file  
`// EXCLUDE_AI_TEST_GEN_SCAN `

## Command Usage

```bash
node ./node_modules/ai-test-gen-angular/index.js "relative/path/to/some-filename.component.ts" "./tsconfig.json" [--read-from-index-files] [--aws-bedrock]
```

#### Description

Generates Angular unit tests for the specified TypeScript file using AI-based testing techniques.

#### Arguments

- `<relative/path/to/component/or/service/ts-file>`  
  The relative path to the TypeScript file of the component or service for which you want to generate tests.

- `<relative/path/to/tsconfig-file>`  
  The relative path to the tsconfig.json file that configures your Angular project.

#### Options

- `--read-from-index-files`  
  Use this flag to instruct the tool to generate tests by reading models/enums exported via index.ts files.

- `--aws-bedrock`
  If you want to use AWS Bedrock anthropic claude instead of openAI, then use this flag.
  You need to set 3 environment variables to use this flag

```bash
export AWS_ACCESS_KEY=****************
export AWS_SECRET_KEY=****************
export AWS_REGION=*********
```

## Example

```bash
node ./node_modules/ai-test-gen-angular/index.js src/app/pipes/get-number-suffix.pipe.ts ./tsconfig.base.json
```

#### Input file

```javascript
import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: "getNumberSuffix",
  pure: false,
})
export class GetNumberSuffixPipe implements PipeTransform {
  transform(number: number) {
    let suffix;

    if (number >= 11 && number <= 13) {
      suffix = "th";
    } else {
      const lastDigit = number % 10;
      switch (lastDigit) {
        case 1:
          suffix = "st";
          break;
        case 2:
          suffix = "nd";
          break;
        case 3:
          suffix = "rd";
          break;
        default:
          suffix = "th";
          break;
      }
    }

    return suffix;
  }
}
```

#### Generated output test case file

File is generated in same folder as of its input file : src/app/pipes/get-number-suffix.pipe.ai-test-gen.spec.ts

```javascript
import { GetNumberSuffixPipe } from "./get-number-suffix.pipe";

describe("GetNumberSuffixPipe", () => {
  let pipe: GetNumberSuffixPipe;

  beforeEach(() => {
    pipe = new GetNumberSuffixPipe();
  });

  it("should create an instance", () => {
    expect(pipe).toBeTruthy();
  });

  it('should return "th" for numbers between 11 and 13', () => {
    expect(pipe.transform(11)).toBe("th");
    expect(pipe.transform(12)).toBe("th");
    expect(pipe.transform(13)).toBe("th");
  });

  it('should return "st" for numbers ending with 1', () => {
    expect(pipe.transform(1)).toBe("st");
    expect(pipe.transform(21)).toBe("st");
    expect(pipe.transform(31)).toBe("st");
  });

  it('should return "nd" for numbers ending with 2', () => {
    expect(pipe.transform(2)).toBe("nd");
    expect(pipe.transform(22)).toBe("nd");
    expect(pipe.transform(32)).toBe("nd");
  });

  it('should return "rd" for numbers ending with 3', () => {
    expect(pipe.transform(3)).toBe("rd");
    expect(pipe.transform(23)).toBe("rd");
    expect(pipe.transform(33)).toBe("rd");
  });

  it('should return "th" for all other numbers', () => {
    expect(pipe.transform(4)).toBe("th");
    expect(pipe.transform(10)).toBe("th");
    expect(pipe.transform(20)).toBe("th");
    expect(pipe.transform(30)).toBe("th");
    expect(pipe.transform(40)).toBe("th");
    expect(pipe.transform(100)).toBe("th");
  });
});
```

### Example 2

#### Reading data from index files

```bash
node ./node_modules/ai-test-gen-angular/index.js src/app/pipes/get-number-suffix.pipe.ts ./tsconfig.base.json --read-from-index-files
```

## Note

For better result you can store your class models, types, enum, interface in files with an extension below

We scan files with below extensions

1. .model.ts
2. .enum.ts
3. .interface.ts
4. .type.ts

and folders with naming conventin

1. models/
2. enums/
3. interfaces/
4. types/

Please be aware that the generated file will not be directly executable but hopefully it generates a code snippet to lessen the effort of the developer. In some cases, the file may contain superfluous or absent characters at its start or end. In such cases, it may be necessary to perform manual adjustments. This is a natural aspect of utilizing generative AI technology.
