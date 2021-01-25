extern crate engine;

use clap::{App, Arg};
use engine::Error;
use log::{error, info};
use std::fs;
use std::io;
use std::path::Path;
use std::process::exit;

#[allow(dead_code)]
fn unwrap<T, E, F>(input: Result<T, E>, f: F) -> T
where
    F: FnOnce(E),
{
    match input {
        Ok(x) => x,
        Err(e) => {
            f(e);
            std::process::exit(-1)
        }
    }
}

fn interpret_io_error(kind: io::ErrorKind) -> String {
    format!("{:?}", kind)
}

fn handle_error(e: Error) -> ! {
    match e {
        Error::FsError {
            path,
            desc,
            because,
        } => {
            error!(
                "{} at {:?} because {}",
                desc,
                path,
                interpret_io_error(because.kind())
            );
            exit(because.raw_os_error().unwrap_or(-1));
        }
        Error::Internal(msg) => {
            error!("internal error ({})", msg);
            exit(-1);
        }
        Error::InvalidLink { link, msg, loc } => {
            error!("{} InvalidLink {:?} ({})", loc, link, msg);
            exit(-1);
        }
        Error::ImageFmtError {
            path,
            desc,
            because,
        } => {
            error!("{} at {:?} because {:?}", desc, path, because);
            exit(-1);
        }
        Error::ZipError { desc, because } => {
            error!("zip operation error. {} because {}", desc, because);
            // FIXME
            exit(-1);
        }
        Error::NoSuchCmd { name, loc } => {
            error!("{} No such command \\{}", loc, name);
            // FIXME
            exit(-1);
        }
        Error::ZipIOError { desc, because } => {
            error!("zip operation error. {} because {}", desc, because);
            // FIXME
            exit(-1);
        }
        Error::ProcessError { loc, desc } => {
            error!("{} {}", loc, desc);
            exit(-1);
        }
        Error::SyntaxError(loc) => {
            error!("{} syntax error", loc);
            exit(-1);
        }
        Error::MissingAttribute { name, loc } => {
            error!("{} missing attribute {}", loc, name);
            exit(-1);
        }
        Error::InvalidAttributeType {
            name,
            loc,
            expected,
            found,
        } => {
            error!(
                "{} invalid attribute type {} at {}. {} is expected",
                loc, found, name, expected
            );
            exit(-1);
        }
        Error::CannotInterpretPathAsUTF8(path) => {
            error!(
                "cannot interpret path {:?}. all paths must be encoded by UTF-8",
                path
            );
            exit(-1);
        }
    }
}

fn main() {
    env_logger::init();
    info!("start compiling");
    let matches = App::new("engine")
        .arg(Arg::with_name("SOURCE").required(true).takes_value(true))
        .arg(Arg::with_name("DEST").required(true).takes_value(true))
        .get_matches();
    let dir_path = Path::new(matches.value_of("SOURCE").unwrap());
    let dist_path = Path::new(matches.value_of("DEST").unwrap());
    match fs::File::create(&dist_path) {
        Ok(mut writer) => {
            if let Err(e) = engine::compile_and_write(&mut writer, &dir_path) {
                fs::remove_file(&dist_path).ok();
                handle_error(e);
            }
        }
        Err(e) => {
            error!("Cannot create zip file {} ", interpret_io_error(e.kind()));
            exit(e.raw_os_error().unwrap_or(-1));
        }
    }
}
