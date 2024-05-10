const AnthropicBedrock = require("@anthropic-ai/bedrock-sdk");
const fs = require("fs");
const OpenAI = require("openai");
let currPath = process.argv[1];
let targetFilePath = process.argv[2];
let shouldReadFromIndex = process.argv.includes("--read-from-index-files");
currPath = currPath.split("/");
let projectAbosultePath = currPath.slice(0, currPath.length - 3).join("/");
userCustomPrompt = "";
if (process.argv.includes("--aws-bedrock")) {
  if (!process.env.AWS_ACCESS_KEY) {
    throw Error(
      "Environment variable AWS_ACCESS_KEY is missing. It is required if you want to use the flag `--aws-bedrock`"
    );
  }
  if (!process.env.AWS_SECRET_KEY) {
    throw Error(
      "Environment variable AWS_SECRET_KEY is missing. It is required if you want to use the flag `--aws-bedrock`"
    );
  }
  if (!process.env.AWS_REGION) {
    throw Error(
      "Environment variable AWS_REGION is missing. It is required if you want to use the flag `--aws-bedrock`"
    );
  }
} else if (!process.env.OPENAI_API_KEY) {
  throw Error("Environment variable OPENAI_API_KEY is missing");
}

targetFilePath = targetFilePath
  .split("/")
  .filter((f) => f !== "." || f !== "..")
  .join("/");
targetFilePath = `${projectAbosultePath}/${targetFilePath}`;
if (process.argv.includes("--help")) {
  help();
  return;
}
if (process.argv.includes("-p")) {
  let pidx = process.argv.indexOf("-p");
  let pval = process.argv[pidx + 1];
  userCustomPrompt = pval;
}
if (process.argv.length < 4) {
  console.log(
    "\nERROR: Incorrect command. \n\nUSAGE : node ./node_modules/ai-test-gen-angular/index.js <relative/path/to/component/or/service/ts-file> <relative/path/to/tsconfig-file>\n"
  );
  help();
  return;
}
let tsconfigPath = `${projectAbosultePath}/tsconfig.json`;
if (process.argv[3]) {
  tsconfigPath = `${projectAbosultePath}/${process.argv[3]}`;
} else {
  throw Error(
    "Incorrect command. Usage : node ./node_modules/ai-test-gen-angular/index.js <src/path/to/component/or/service/ts-file> <src/path/to/ts-config-file>"
  );
}
let tsconfig = { compilerOptions: { path: {} } };
try {
  console.log("\nReading ", tsconfigPath);
  tsconfig = require(tsconfigPath);
} catch (error) {
  console.error("ERROR: tsconfig not present at root folder\n", error);
  return;
}

let pathMap = {};
if (tsconfig.compilerOptions && tsconfig.compilerOptions.paths) {
  let pathObj = tsconfig.compilerOptions.paths;
  for (let key in pathObj) {
    if (Object.hasOwnProperty.call(pathObj, key)) {
      let value = pathObj[key];
      let key1 = key.replace(/\*/g, "");
      value = value[0].replace(/\*/g, "");
      pathMap[key1] = value;
    }
  }
}

let outputFile = targetFilePath.replace(".ts", ".ai-test-gen.spec.ts");
let concatenatedData = "";
concatenatedData = readFilesRecursivelyForModels(
  targetFilePath,
  "Generate Unit test for Below code : ",
  []
);

function countOccurrences(str, substr) {
  let count = 0;
  let position = str.indexOf(substr);

  while (position !== -1) {
    count++;
    position = str.indexOf(substr, position + 1);
  }

  return count;
}

function scanReadFile(filePath) {
  let data = fs.readFileSync(filePath, "utf8");
  if (data.includes("EXCLUDE_AI_TEST_GEN_SCAN")) {
    console.log("\n Excluded Scanning  ", filePath);
    return "";
  }
  console.log("\nScanning  ", filePath);
  return data;
}

function readFilesRecursivelyForModels(currFilePath, prefixedString, alreadyReadFiles) {
  const currFilePathElements = currFilePath.split("/");
  const pattern = /import\s*(?:{([^}]*)})?\s*(?:([^{}\n]+))?\s*from\s*['"]([^'"]+)['"]/g;

  try {
    if (alreadyReadFiles.includes(currFilePath)) {
      return "";
    }

    alreadyReadFiles.push(currFilePath);
    let data = scanReadFile(currFilePath);

    let match;
    childData = "";
    while ((match = pattern.exec(data))) {
      const namedImports = match[1] ? match[1].split(",").map((name) => name.trim()) : [];
      const defaultImport = match[2] ? match[2].trim() : null;
      let importPath = match[3];
      Object.keys(pathMap).forEach((key) => {
        importPath = importPath.replace(key, pathMap[key]);
      });
      importPath = convertToProjectAbsPath(currFilePathElements, importPath);
      if (
        importPath.includes(".model") ||
        importPath.includes(".enum") ||
        importPath.includes(".interface") ||
        importPath.includes(".type")
      ) {
        importPath = importPath + ".ts";
        childData =
          childData + " " + readFilesRecursivelyForModels(importPath, "", alreadyReadFiles);
      } else if (
        shouldReadFromIndex &&
        (importPath.endsWith("/models") ||
          importPath.endsWith("/enums") ||
          importPath.endsWith("/interfaces") ||
          importPath.includes("/types"))
      ) {
        if (alreadyReadFiles.includes(importPath + "/index.ts")) {
          continue;
        }
        alreadyReadFiles.push(importPath + "/index.ts");
        let indexFileData = scanReadFile(importPath + "/index.ts");
        let indexFilePathElements = [...importPath.split("/"), "index.ts"];

        const regex = /(['"])(.*?)\1/g;

        possibilitiesFileNames = [...indexFileData.matchAll(regex)].map((match) => match[2]).sort();
        for (let namedIndex = 0; namedIndex < namedImports.length; namedIndex++) {
          const namedImportClassName = namedImports[namedIndex];
          let actualFileNames = maxSequentialOccurrence(
            namedImportClassName,
            possibilitiesFileNames
          );
          actualFileNames = actualFileNames.map((fileName) => {
            return fileName.split("/").join("/");
          });
          for (let actualFileIdx = 0; actualFileIdx < actualFileNames.length; actualFileIdx++) {
            const actualFileName = actualFileNames[actualFileIdx];

            let actualFilePath = convertToProjectAbsPath(
              indexFilePathElements,
              actualFileName + ".ts"
            );
            childData =
              childData + " " + readFilesRecursivelyForModels(actualFilePath, "", alreadyReadFiles);
          }
        }
      }
    }

    return childData + prefixedString + data;
  } catch (error) {
    console.log(error);
  }
}

function convertToProjectAbsPath(currFilePathElements, importPath) {
  let doubleDotCount = countOccurrences(importPath, "../");
  let singleDotCount = countOccurrences(importPath, "./");
  if (doubleDotCount > 0) {
    let tillIdx = currFilePathElements.length - 1 - doubleDotCount;
    let newpath = currFilePathElements.slice(0, tillIdx);
    newpath.push(...importPath.split("/").filter((f) => f !== ".."));
    importPath = newpath.join("/");
  } else if (singleDotCount > 0) {
    let tillIdx = currFilePathElements.length - 1;
    let newpath = currFilePathElements.slice(0, tillIdx);
    newpath.push(...importPath.split("/").filter((f) => f !== "."));
    importPath = newpath.join("/");
  } else {
    importPath = `${projectAbosultePath}/${importPath}`;
  }
  return importPath;
}
function maxSequentialOccurrence(givenString, possibilities) {
  const matches = [];
  givenString = givenString.toLowerCase();
  possibilities = possibilities.map((p) => p.toLowerCase());
  for (const element of possibilities) {
    let currentPos = 0;
    let isMatch = false;

    for (const char of element) {
      if (char === givenString[currentPos]) {
        currentPos++;
        if (currentPos === givenString.length) {
          isMatch = true;
          break;
        }
      }
    }

    if (isMatch) {
      matches.push(element);
    }
  }

  return matches;
}
async function main() {
  let system_prompt = `### Task
    Write unit test and output only the generated unit test code which uses jasmine framework:
    ### Important System Instructions
    Follow the below instructions: 
    1. Ensure that you write tests for each function present in the code.
    2. Ensure maximum coverage for lines, function, statements and branches. 
    3. Ensure that the generated mock data is as per the provided type interface, class or enum. Also validate that any nested models in the mock data conform to their defined interfaces/classes.
    4. Additionally, make sure to test edge cases and handle potential error scenarios. 
    5. Ensure that all opening brackets are properly closed.  
  `;
  if (userCustomPrompt) {
    userCustomPrompt = `\n\n Please note the user's may ask to compulsorily write test cases for some specified functions name with respect to provided code or any other unit test related task, so fullfil the user's ask at top priority related to unit tests. User Custom Query: ${userCustomPrompt}`;
    system_prompt = system_prompt + userCustomPrompt;
  }
  let prompt_text = "";
  prompt_text += concatenatedData;
  prompt_text = prompt_text + " output: ";
  const ASSISTANT = { role: "system", content: system_prompt };
  console.log("\nCreating unit tests ⏳⏳");
  let outputText = "";
  if (!process.argv.includes("--aws-bedrock")) {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.chat.completions.create({
      temperature: 0,
      model: "gpt-3.5-turbo-16k",
      messages: [ASSISTANT, { role: "user", content: prompt_text }],
    });

    outputText = response.choices[0].message.content;
  } else {
    const client = new AnthropicBedrock.AnthropicBedrock({
      timeout: 1000 * 60 * 10,
      awsAccessKey: process.env.AWS_ACCESS_KEY,
      awsSecretKey: process.env.AWS_SECRET_KEY,
      awsRegion: process.env.AWS_REGION,
    });
    outputText = await client.completions.create({
      model: "anthropic.claude-v2",
      max_tokens_to_sample: 80000,
      prompt: `${AnthropicBedrock.HUMAN_PROMPT} ${system_prompt} \n ${prompt_text} ${AnthropicBedrock.AI_PROMPT}`,
    });
    outputText = outputText.completion;
  }

  console.log(outputText);
  if (outputText.endsWith("```")) {
    outputText = outputText.slice(0, outputText.length - 3);
  }
  outputText = outputText.startsWith("{") ? `import ${outputText}` : outputText;
  fs.writeFileSync(outputFile, outputText);
  outputFile = outputFile
    .split("/")
    .filter((f) => f !== "." || f !== "..")
    .join("/");

  console.log(
    "\n \n------------------------------------------------------\nFor better result you can store your class models, types, enum, interface in files with extension \n1) .model.ts \n2) .enum.ts \n3) .interface.ts \n\n NOTE: the generated file may have some extra or missing characters at the start or end of the file which may need to be removed or added manually."
  );
  console.log("\n\nCreated !!! ✅✅ \nFile written to the path 👉 : 🔗 ", outputFile, "\n");
}
function help() {
  let helpData = fs.readFileSync(
    projectAbosultePath + "/node_modules/ai-test-gen-angular/command-help.txt",
    "utf-8"
  );
  console.log(helpData);
}
main();
