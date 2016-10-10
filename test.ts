import { InitialRenderBenchmark, InitialRenderSamples, ITab, Runner } from "chrome-tracing";
import * as fs from "fs";

const BASE_PORT = 9292;

let browserOpts = process.env.CHROME_BIN ? {
  type: "exact",
  executablePath: process.env.CHROME_BIN
} : {
  type: "system"
};

let experiments = JSON.parse(fs.readFileSync('config/experiments.json', 'utf8'));

async function sleep(ms) {
  await new Promise(resolve => setTimeout(resolve, 2500));
}

class EmberBench extends InitialRenderBenchmark {
  static all(): EmberBench[] {
    return experiments.map((experiment, i) => {
      let { name, url } = experiment;
      let port = BASE_PORT + i;

      if (!url) {
        url = "/";
      } else if (url.charAt(0) !== "/") {
        url = "/" + url;
      }

      return new EmberBench(name, port, `http://localhost:${port}${url}`);
    });
  }

  constructor(name: string, private port: number, private url: string) {
    super({
      name,
      url,
      markers: [
        { start: "welcomeToEmber", label: "welcomeToEmber" },
      ],
      browser: browserOpts
    });
  }

  async warm(tab: ITab): Promise<void> {
    await tab.navigate(`http://localhost:${this.port}/preload.html`, true);

    await sleep(2500);

    await tab.navigate(this.url, true);

    await sleep(2500);

    await tab.navigate(this.url, true);

    await sleep(2500);

    await tab.navigate(this.url, true);

    await sleep(2500);
  }
}

new Runner(EmberBench.all())
.run(100)
.then(results => {
  results.forEach(result => {
    fs.writeFileSync(`results/${result.set}.json`, JSON.stringify(result))
  });
}).catch(err => {
  console.error(err.stack);
  process.exit(1);
});
