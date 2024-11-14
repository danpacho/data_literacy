const GU_DATA = [
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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const parsingDongList = () => {
  const ulDongElement = document.getElementById("ulDong");
  const dongList = [];
  ulDongElement.childNodes.forEach((liElement) => {
    const onclickLiteral = getAttribute("onclick");
    const matches = onclickLiteral
      .match(/'([^']+)'/g)
      .map((match) => match.replace(/'/g, ""));

    dongList.push(matches);
  });

  return dongList;
};

/**
 * Parsing Data from Seoul City Website
 * @param {Literal<"staticPopulation" | "movingPopulation" | "storeCount" | "storeProfit">} parsingType
 * @returns {Promise<Record<string, Record<string, number>>>}
 */
const parsingData = async (parsingType) => {
  const contentParser = {
    staticPopulation: (contentText) => {
      return parseInt(contentText.replace(/,|명/g, ""), 10);
    },
    movingPopulation: (contentText) => {
      return parseInt(contentText.replace(/,|만명/g, ""), 10);
    },
    storeCount: (contentText) => {
      return parseInt(contentText.replace(/,|개/g, ""), 10);
    },
    storeProfit: (contentText) => {
      return parseInt(contentText.replace(/,|만/g, ""), 10);
    },
  };

  const contentTextParserLogic = contentParser[parsingType];

  const finalResult = {};

  GU_DATA.forEach(async (data) => {
    const [name, code] = data;
    $("#region_checkbox").click(); // Open Region Checkbox -> True

    exeGuToggle(name, code); // Select Gu
    exeDongToggle("전체", "all"); // Select All Dongs
    const dongList = parsingDongList();
    const result = {};
    const overlayContainer = document.querySelector(".ol-overlaycontainer");

    dongList.forEach((dong) => {
      const [dongName, dongCode] = dong;
      exeDongToggle(dongName, dongCode); // Select Dong

      overlayContainer
        .querySelectorAll(".ol-overlay-container")
        .forEach((container) => {
          const dataElement = container.querySelector(".data");
          if (dataElement) {
            const name =
              dataElement.querySelector("p:nth-child(1)").textContent;
            const contentText =
              dataElement.querySelector("p:nth-child(2)").textContent;

            result[name] = contentTextParserLogic(contentText);
          }
        });
      finalResult[name] = result;
    });

    await sleep(1500); // Sleep 1.5s
  });

  return finalResult;
};
