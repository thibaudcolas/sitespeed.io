---
layout: default
title: Use WebPageTest together with sitespeed.io
description: Drive WebPageTest using sitespeed.io and include the metrics in your sitespeed.io report.
keywords: webpagetest, wpt, documentation, web performance, sitespeed.io
nav: documentation
image: https://www.sitespeed.io/img/sitespeed-2.0-twitter.png
category: sitespeed.io
twitterdescription: Drive WebPageTest using sitespeed.io and include the metrics in your sitespeed.io report.
---
[Documentation]({{site.baseurl}}/documentation/sitespeed.io/) / WebPageTest

# WebPageTest
{:.no_toc}

* Lets place the TOC here
{:toc}

## Using WebPageTest
To use WebPageTest you need to install the [WebPageTest plugin](https://github.com/sitespeedio/plugin-webpagetest) or run the Docker `sitespeedio/sitespeed.io:{% include version/sitespeed.io.txt %}-webpagetest` container.

To use WPT you need to setup your own WebPageTest instance (read how [Wikimedia setup an instance using AWS](https://wikitech.wikimedia.org/wiki/WebPageTest)) or have one of those (old) keys for the public instance.

## Configuration
The plugin uses the [WebPageTest API](https://github.com/marcelduran/webpagetest-api), so you can do almost all the same thing as with the standalone API.

By default we have the following configuration options:

~~~
--webpagetest.host          The domain of your WebPageTest instance.
--webpagetest.key           The API key for your WebPageTest instance.
--webpagetest.location      The location for the test
--webpagetest.connectivity  The connectivity for the test.
--webpagetest.runs          The number of runs per URL.
--webpagetest.custom        Execute arbitrary JavaScript at the end of a test to collect custom metrics.
--webpagetest.script        Direct WebPageTest script as a string
--webpagetest.file          Path to a script file
~~~

If you need anything else adding your own CLI parameter will propagate to the WebPageTest API. Checkout the different [options](https://github.com/marcelduran/webpagetest-api#test-works-for-test-command-only) for the API.

Example: So say that you want to change the user agent of your test. In the API you can do that with <code>--useragent</code>. Pass the same to sitespeed.io by prefixing webpagetest like so <code>--webpagetest.useragent</code> in the cli.

~~~bash
docker run --rm -v "$(pwd):/sitespeed.io" sitespeedio/sitespeed.io:{% include version/sitespeed.io.txt %}-webpagetest --plugins.add /webpagetest/index.js --webpagetest.host my.wpt.host.com --webpagetest.useragent "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.59 Safari/537.36" https://www.sitespeed.io
~~~

## Default configurations

The default configuration for WebPageTest looks like this:

~~~json
{
  pollResults: 10,
  timeout: 600,
  includeRepeatView: false,
  private: true,
  aftRenderingTime: true,
  location: 'Dulles:Chrome',
  connectivity: 'Cable',
  video: true
}
~~~

You can override these with parameters. If you want to change the location, just pass <code>--webpagetest.location mylocation</code> and your new location will be used.

### WebPageTest scripting

WebPageTest has scripting capability where you can easily automate a multi-step test (e.x. login as a user and do some interaction). That is supported by sitespeed.io by supplying the script. You can do so like this:

You can create your script file (checkout [WebPageTest documentation](https://sites.google.com/a/webpagetest.org/docs/using-webpagetest/scripting) for what you can do). It can look something like this (wptScript.txt):

~~~shell
logData    0

// put any urls you want to navigate
navigate    www.aol.com
navigate    news.aol.com

logData    1

// this step will get recorded
navigate    news.aol.com/world
~~~

Then change your URL you want test (probably the last one) to \{\{\{URL\}\}\} and then all occurrences of \{\{\{URL\}\}\} will then be replaced with the current URL that should be tested. Now run sitespeed.io with the additional parameters:

~~~bash
docker run --rm -v "$(pwd):/sitespeed.io" sitespeedio/sitespeed.io:{% include version/sitespeed.io.txt %}-webpagetest --plugins.add /webpagetest/index.js --webpagetest.file /sitespeed.io/wptScript.txt --webpagetest.host my.wpt.host.com http://example.org
~~~

It is also possible to pass the WebPageTest script as a string into the `--webpagetest.script` flag. You can use the `scriptToString()` method provided in [webpagetest-api](https://github.com/marcelduran/webpagetest-api/#module-1) to create a string from a JSON object.

{% assign bashURLString = '{{{URL}}}}' %}

~~~bash
docker run --rm -v "$(pwd):/sitespeed.io" sitespeedio/sitespeed.io:{% include version/sitespeed.io.txt %}-webpagetest --plugins.add /webpagetest/index.js --webpagetest.script "navigate \t www.aol.com \n navigate \t {{bashURLString}}" --webpagetest.host my.wpt.host.com http://example.org
~~~

### Custom metrics

Hey we love custom metrics and you can fetch them using WPT. Checkout the [metrics docs](https://sites.google.com/a/webpagetest.org/docs/using-webpagetest/custom-metrics) for WPT and then create a file containing your metrics:

~~~shell
[iframe-count]
return document.getElementsByTagName("iframe").length;

[script-tag-count]
return document.getElementsByTagName("script").length;

[meta-viewport]
var viewport = undefined;
var metaTags=document.getElementsByTagName("meta");
for (var i = 0; i < metaTags.length; i++) {
    if (metaTags[i].getAttribute("name") == "viewport") {
        viewport = metaTags[i].getAttribute("content");
        break;
    }
}
return viewport;
~~~

You can then run sitespeed.io to pick up the new custom metrics:

~~~bash
docker run --rm -v "$(pwd):/sitespeed.io" sitespeedio/sitespeed.io:{% include version/sitespeed.io.txt %}-webpagetest --plugins.add /webpagetest/index.js --webpagetest.custom /sitespeed.io/myScriptFile.txt --webpagetest.host my.wpt.host.com https://www.sitespeed.io
~~~

## Run WebPageTest without Browsertime

Sometimes you want to only collect data from WebPageTest and not from Browsertime. The best way to do that is to disable the Browsertime plugin with *--plugins.remove browsertime*

~~~bash
docker run --rm -v "$(pwd):/sitespeed.io" sitespeedio/sitespeed.io:{% include version/sitespeed.io.txt %}-webpagetest --plugins.add /webpagetest/index.js --webpagetest.host my.wpt.host.com --plugins.remove browsertime https://www.sitespeed.io
~~~
