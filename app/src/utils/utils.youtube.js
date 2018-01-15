import request from "request";
import cmd from "node-cmd";

import * as types from "../constants/YoutubeConstants";

import { base64ArrayBuffer } from "../utils/utils.github";

export const download = (url) => {
  cmd.get(
    `youtube-dl -o "./%(title)s.%(ext)s" -i --format m4a --embed-thumbnail --add-metadata ${url}`,
    (err, data, stderr) => {
      if (!err) {
        console.log(data);
      } else {
        console.warn('error', err);
      }
    }
  );
}

export const downloadImage = (url) => {
  return new Promise((resolve, reject) => {
    fetchImageUrl(url)
      .then((imageUrl) => {
        let req = require('request').defaults({ encoding: null });

        req.get(url, (error, response, body) => {
          if (!error && response.statusCode == 200) {
            let data = "data:" + response.headers["content-type"]
              + ";base64," + base64ArrayBuffer(body);
            resolve(data);
          } else {
            reject(types.YOUTUBE_DOWNLOAD_IMAGE_FAILED);
          }
        });
      })
      .catch((reason) => {
        console.warn("downloadImage: " + reason);
      });
  });
};

export const fetchImageUrl = (url) => {
  return new Promise((resolve, reject) => {
    cmd.get(
      `youtube-dl --get-thumbnail ${url}`,
      (err, data, stderr) => {
        if (!err) {
          if (data.length > 0) {
            resolve(data);
            return;
          }
        }
        console.log("error", err);
        reject(types.YOUTUBE_FETCH_IMAGE_URL_FAILED);
      }
    );
  })
    .catch((reason) => {
      console.warn("fetchImageUrl: " + reason);
    });
};