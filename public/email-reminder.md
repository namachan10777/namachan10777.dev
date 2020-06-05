:date 2020-6-6
::

# Emailのリマインダを書いた

奨学金の書類の不備を指摘されていたことに2週間経って気がついた。
こういうことを今まで可算無限解繰り返して、頑張りでは結局どうにもならなかった経験があるのでついにリマインダを書く事にした。
大体頑張って直るなら最初から未読のメールで破滅したりしてないと思う。

管理する必要があるGmail、大学のメール、学群のメールは全てIMAPなのでIMAPだけ対応すれば良い。
[crates.io](https://crates.io)で検索したらドンピシャのライブラリが出てきたのでサンプルコードを元にほぼ1日で書けた。
RFC822のパーサやパスワードのプロンプトもありモノを使っているので殆どコードを書かずに目的の処理が達成できている。
Rustはエコシステムが強くてライブラリのドキュメントが必ず揃うので楽だ。
パスワードの扱いは面倒だったので毎回入力するようにしたが、絶対1週間もしないうちに面倒くさがり<C-c>で殺すようになると思うので早いところ対処をしたい。
ローカルに`0o400`でDLPを使った暗号鍵を置いて設定ファイルと分ければある程度セキュアな気はするが、
結局平文から解読できてしまう訳で、何かしらのキーリングアプリケーションと連携させる必要がある気がする。
多分そのうち実装する。

```rs
extern crate encoding_rs;
extern crate imap;
extern crate mailparse;
extern crate native_tls;
#[macro_use]
extern crate serde_derive;
extern crate serde;
extern crate serde_json;
extern crate rpassword;

use clap::{App, Arg};
use std::fs;
use std::path;

#[derive(Serialize, Deserialize, Debug)]
struct Account {
    addr: String,
    imap: String,
}

#[derive(Serialize, Deserialize, Debug)]
struct Accounts {
    accounts: Vec<Account>,
}

fn fetch_unseen_subjects(domain: &str, pass: &str, addr: &str) -> imap::error::Result<Vec<String>> {
    let tls = native_tls::TlsConnector::builder().build().unwrap();
    let client = imap::connect((domain, 993), domain, &tls).unwrap();
    let mut imap_session = client.login(addr, pass).map_err(|e| e.0)?;
    imap_session.examine("Inbox")?;
    let mut unseen_subjects = Vec::new();
    for unseen in imap_session.uid_search("NOT SEEN")? {
        let messages = imap_session.uid_fetch(format!("{}", unseen), "RFC822")?;
        for message in messages.iter() {
            let parsed_mail = mailparse::parse_mail(message.body().unwrap()).unwrap();
            for header in parsed_mail.headers {
                if &header.get_key() == "Subject" {
                    unseen_subjects.push(header.get_value())
                }
            }
        }
    }
    imap_session.logout()?;
    Ok(unseen_subjects)
}


fn process(config_path: &path::Path) -> Result<(), String> {
    let config_str = fs::read_to_string(config_path).map_err(|e| {
        format!(
            "Error at reading {} caused by {:?}",
            config_path.display(),
            e
        )
    })?;
    let accounts: Accounts =
        serde_json::from_str(&config_str).map_err(|e| format!("Syntax error {:?}", e))?;
    for account in accounts.accounts {
        println!("Reading unread messages from {}", account.addr);
        let pass = rpassword::prompt_password_stdout("password: ").unwrap();
        for subject in fetch_unseen_subjects(&account.imap, pass.trim_end_matches("\n"), &account.addr)
            .map_err(|e| format!("imap error: {:?}", e))?
        {
            println!("{}", subject);
        }
    }
    Ok(())
}

fn main() {
    let args = App::new("smua")
        .arg(Arg::with_name("CONFIG").required(true).index(1))
        .get_matches();
    let config = args.value_of("CONFIG").unwrap();
    match process(path::Path::new(config)) {
        Ok(()) => {}
        Err(e) => {
            eprintln!("{}", e);
            std::process::exit(-1);
        }
    }
}
```
