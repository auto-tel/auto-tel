<h1 align="center">
    <a href="https://github.com/auto-tel/auto-tel">
        <img src="https://raw.githubusercontent.com/auto-tel/auto-tel-resources/master/static/img/auto-tel.png", alt="" style="max-height:200px"/>
    </a>
</h1>

# auto-tel

## Introduction

auto-tel is a demo powered by aws.polly and RingCentral APIs. auto-tel can automatically make phone calls to target numbers, after connected, read specific text to target number.

## Prerequisites
- latest Chrome browser
- nodejs >= 10.9
- Get a aws account, create aws_access_key_id and aws_secret_access_key, put it in `~/.aws/credentials`, like this:
```bash
[default]
aws_access_key_id = <your aws_access_key_id>
aws_secret_access_key = <your aws_secret_access_key>
```
refer to https://docs.aws.amazon.com/general/latest/gr/aws-security-credentials.html

- Register a Ringcentral developer account, add a browser based app with all permissions, add a free digital phone device in app dashboard, add `http://localhost:5370/redirect.html` to OAuth Redirect URI

refer to https://developer.ringcentral.com

## dev run
```bash
git clone https://github.com/auto-tel/auto-tel.git
cd auto-tel
npm i
cp config.sample.js config.js
# then edit config.js,
# fill the required props
# appKey(RingCentral app Client ID),
# appSecret(RingCentral app Secret)

# run server
npm run s

# run client,
# after compile ok, will open in default browser(make sure it is Chrome)
npm run c
```

## build
```
npm run pack
# output work/auto-tel.tar.gz
```

## License
MIT