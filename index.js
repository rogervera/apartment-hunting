import express from "express";
const app = express();
const port = process.env.PORT || 2019;

import fetch from "node-fetch";
import html_tablify from "html-tablify";

const transformData = (floorplansData) =>
  Object.values(floorplansData).reduce(
    (acc, floorPlan) => {
      const aptName = floorPlan.ApartmentName;
      const [buildingName, aptNum] = aptName.split("-");
      const floorNum = aptNum[0];
      return /^(19-|29-)/.test(aptName)
        ? {
            ...acc,
            [buildingName]: [
              { ...floorPlan, floorNum, buildingName, aptNum },
              ...acc[buildingName],
            ],
            byFloor: {
              ...acc.byFloor,
              [floorNum]: [
                { ...floorPlan, floorNum, buildingName, aptNum },
                ...acc.byFloor[floorNum],
              ],
            },
          }
        : acc;
    },
    { 19: [], 29: [], byFloor: { 1: [], 2: [], 3: [], 4: [] } }
  );

const getInfo = (aptList) =>
  aptList.map((apt) => ({
    Building: `1${apt.buildingName}`,
    "Apt. # (odd #s face river)": apt.aptNum,
    Floor: apt.floorNum,
    "Available date": apt.AvailableDate,
    "Min. rent": apt.MinimumRent,
    "Max. rent": apt.MaximumRent,
    "Link to apply": `<a href="${apt.ApplyOnlineURL}">Application URL</a>`,
    "Apt. type": apt.FloorplanName,
    Beds: apt.Beds,
    "Floorplan Image": `<a href="${apt.FloorplanImageURL}">Click for image</a>`,
    "Sqft.": apt.SQFT,
    "Is available?": apt._available,
  }));

const checkVermellaListing = async () => {
  const response = await fetch("https://vermellawest.com/api-floorplans2");
  const rawData = await response.json();
  const data = transformData(rawData.floorplans);

  const building29Data = getInfo(data[29]);
  const building19Data = getInfo(data[19]);
  return [...building19Data, ...building29Data];
};

app.get("/", async (request, response) => {
  const name = process.env.NAME || "World";

  const data = await checkVermellaListing();
  const html_data = html_tablify.tablify({ data });
  response.send(html_data);
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
