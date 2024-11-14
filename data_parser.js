class App {
  static GU_DATA = [
    ["강남구", "11680"],
    ["강동구", "11740"],
    ["강북구", "11305"],
    ["강서구", "11500"],
    ["관악구", "11620"],
    ["광진구", "11215"],
    ["구로구", "11530"],
    ["금천구", "11545"],
    ["노원구", "11350"],
    ["도봉구", "11320"],
    ["동대문구", "11230"],
    ["동작구", "11590"],
    ["마포구", "11440"],
    ["서대문구", "11410"],
    ["서초구", "11650"],
    ["성동구", "11200"],
    ["성북구", "11290"],
    ["송파구", "11710"],
    ["양천구", "11470"],
    ["영등포구", "11560"],
    ["용산구", "11170"],
    ["은평구", "11380"],
    ["종로구", "11110"],
    ["중구", "11140"],
    ["중랑구", "11260"],
  ];

  static sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  #parsingResult = {};
  parsingResult = () => this.#parsingResult;
  parsingResultJson = () => JSON.stringify(this.#parsingResult);
  parsingResultCSV = () => {
    const csv = [];
    const header = ["구", "동", "인구", "이동인구", "상점수", "상점매출"];
    csv.push(header.join(","));

    for (const gu in this.#parsingResult) {
      for (const dong in this.#parsingResult[gu]) {
        const row = [
          gu,
          dong,
          this.#parsingResult[gu][dong].staticPopulation,
          this.#parsingResult[gu][dong].movingPopulation,
          this.#parsingResult[gu][dong].storeCount,
          this.#parsingResult[gu][dong].storeProfit,
        ];
        csv.push(row.join(","));
      }
    }

    return csv.join("\n");
  };

  constructor() {}

  #parsingDongList = async () => {
    const ulDongElement = document.getElementById("ulDong");

    await App.sleep(1000);

    const dongList = [];
    ulDongElement.childNodes.forEach((liElement) => {
      const onclickLiteral = liElement.getAttribute("onclick");
      const matches = onclickLiteral
        .match(/'([^']+)'/g)
        .map((match) => match.replace(/'/g, ""));

      dongList.push(matches);
    });

    return dongList;
  };

  #log = (message) => {
    console.log(`App::${message}`);
  };

  parsingData = async (parsingType) => {
    this.#log(`\nParsing Init : ${parsingType}\n`);

    const contentParser = {
      staticPopulation: (contentText) =>
        parseInt(contentText.replace(/,|명/g, ""), 10),
      movingPopulation: (contentText) =>
        parseInt(contentText.replace(/,|만명/g, ""), 10),
      storeCount: (contentText) =>
        parseInt(contentText.replace(/,|개/g, ""), 10),
      storeProfit: (contentText) =>
        parseInt(contentText.replace(/,|만/g, ""), 10),
    };

    const contentTextParserLogic = contentParser[parsingType];
    const parsingResult = {};

    for (const data of App.GU_DATA) {
      const [name, code] = data;

      exeGuToggle(name, code); // Select Gu
      this.#log(`Selected Gu : ${name}`);
      await App.sleep(1000);

      exeDongToggle("전체", "all"); // Select All Dongs
      this.#log(`Selected Dong : 전체`);
      await App.sleep(1000);

      const dongList = await this.#parsingDongList();
      this.#log(`Dong List : ${dongList.length}`);

      await App.sleep(1000);
      $("#region_checkbox").click(); // Open Region Checkbox -> True
      this.#log(`Region Checkbox : True`);

      const result = {};
      const overlayContainer = document.querySelector(".ol-overlaycontainer");

      for (const dong of dongList) {
        const [dongName, dongCode] = dong;
        this.#log(`Selected Dong : ${dongName}`);
        exeDongToggle(dongName, dongCode); // Select Dong

        await App.sleep(1000);

        overlayContainer
          .querySelectorAll(".ol-overlay-container")
          .forEach((container) => {
            this.#log(`Parsing Data at : ${dongName}`);
            const dataElement = container.querySelector(".data");
            if (dataElement) {
              const name =
                dataElement.querySelector("p:nth-child(1)").textContent;
              const contentText =
                dataElement.querySelector("p:nth-child(2)").textContent;
              result[name] = contentTextParserLogic(contentText);
              this.#log(`Parsed Data : ${name} -> ${contentText}`);
            }
          });

        await App.sleep(1500); // Wait 1.5 seconds before the next dong
      }

      parsingResult[name] = result;
    }

    this.#parsingResult = parsingResult;

    return parsingResult;
  };
}

const app = new App();

const execution = async (app) => {
  await app.parsingData("storeProfit");
  return app.parsingResultJson();
};

const resultJson = await execution(app);
