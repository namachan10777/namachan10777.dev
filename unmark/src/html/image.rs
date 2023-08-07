use std::{
    collections::HashMap,
    path::{Path, PathBuf},
};

use image::imageops;
use maplit::hashmap;
use regex::Regex;
use tracing::debug;

use crate::builder::Blob;

#[derive(Debug, Clone)]
pub struct ImageSrc {
    pub dim: (u32, u32),
    pub path: PathBuf,
}

#[derive(Debug, Clone)]
pub struct ImageOptimizeConfig {
    min_width: u32,
    scale_step: f64,
}

impl ImageOptimizeConfig {
    pub fn new(min_width: u32, scale_step: f64) -> Result<Self, ImageError> {
        if scale_step >= 1.0 {
            return Err(ImageError::InvalidScaleStep(scale_step));
        }
        Ok(Self {
            min_width,
            scale_step,
        })
    }
}

#[derive(Debug, thiserror::Error)]
pub enum ImageError {
    #[error("load img {0:?} due to {1}")]
    Load(PathBuf, image::ImageError),
    #[error("not raster image {0:?}")]
    NotRasterImage(PathBuf),
    #[error("encode image {0:?} due to {1}")]
    Encode(PathBuf, image::ImageError),
    #[error("invalid scale step {0}. scale step must be smaller than 1.0")]
    InvalidScaleStep(f64),
}

fn get_size_hint_from_svg(svg: &Blob) -> (u32, u32) {
    let svg = String::from_utf8_lossy(&svg.content);
    let mut svg = svg::read(&svg).unwrap();
    let size = svg.find_map(|event| match event {
        svg::parser::Event::Tag(_, _, attrs) => {
            let (_, w) = attrs.iter().find(|(name, _)| *name == "width")?;
            let (_, h) = attrs.iter().find(|(name, _)| *name == "height")?;
            let w: u32 = w.parse().ok()?;
            let h: u32 = h.parse().ok()?;
            Some((w, h))
        }
        _ => None,
    });
    size.unwrap()
}

pub fn get_img_src(path: &Path, blob: &crate::builder::Blob) -> Result<ImageSrc, ImageError> {
    if path.extension().map(|ext| ext == "svg").unwrap_or(false) {
        let hint = get_size_hint_from_svg(blob);
        Ok(ImageSrc {
            dim: hint,
            path: path.to_owned(),
        })
    } else {
        let img = image::load_from_memory(&blob.content)
            .map_err(|e| ImageError::Load(path.to_owned(), e))?;
        Ok(ImageSrc {
            dim: (img.width(), img.height()),
            path: path.to_owned(),
        })
    }
}

fn srcset(config: &ImageOptimizeConfig, src: &ImageSrc) -> Result<Vec<ImageSrc>, ImageError> {
    let mut srcset = Vec::new();
    let mut w = src.dim.0;
    let mut h = src.dim.1;
    let re = Regex::new(r#"^(.*/.+).(png|webp|jpeg|bmp|ico|gif|jpg)$"#).unwrap();
    let path = src.path.to_string_lossy().to_string();
    let matched = re
        .captures(&path)
        .ok_or_else(|| ImageError::NotRasterImage(src.path.to_owned()))?;
    while w > config.min_width {
        let path = format!(
            "{}-{}w.{}",
            matched.get(1).unwrap().as_str(),
            w,
            matched.get(2).unwrap().as_str()
        );
        srcset.push(ImageSrc {
            dim: (w, h),
            path: path.into(),
        });
        w = (w as f64 * config.scale_step) as u32;
        h = (h as f64 * config.scale_step) as u32;
    }
    srcset.reverse();
    Ok(srcset)
}

pub fn optimized_srcset(
    config: &ImageOptimizeConfig,
    src: &ImageSrc,
) -> Result<Vec<ImageSrc>, ImageError> {
    Ok(srcset(config, src)?
        .into_iter()
        .map(|src| ImageSrc {
            path: src.path.with_extension("webp"),
            dim: src.dim,
        })
        .collect())
}

pub fn optimized_srcset_string(config: &ImageOptimizeConfig, src: &ImageSrc) -> Option<String> {
    let Ok(srcset) = srcset(config, src) else {
        return None
    };
    Some(
        srcset
            .into_iter()
            .map(|src| format!("{} {}w", src.path.to_string_lossy(), src.dim.0))
            .collect::<Vec<_>>()
            .join(", "),
    )
}

pub fn optimize_img(
    config: &ImageOptimizeConfig,
    src: &ImageSrc,
    blob: &crate::builder::Blob,
) -> Result<HashMap<PathBuf, Blob>, ImageError> {
    let Ok(mut srcset)  = optimized_srcset(config, src) else {
        return Ok(hashmap! {
            src.path.to_owned() => blob.clone(),
        })
    };
    srcset.push(ImageSrc {
        dim: src.dim,
        path: src.path.with_extension("webp"),
    });
    let image = image::load_from_memory(&blob.content)
        .map_err(|e| ImageError::Load(src.path.to_owned(), e))?;
    let blobs = srcset
        .iter()
        .map(|src| {
            let image = image.resize(src.dim.0, src.dim.1, imageops::CatmullRom);
            let mut buffer = Vec::new();
            debug!(
                path = src.path.to_string_lossy().to_string(),
                "process_image"
            );
            image::codecs::webp::WebPEncoder::new(&mut buffer)
                .encode(
                    image.as_bytes(),
                    image.width(),
                    image.height(),
                    image.color(),
                )
                .map_err(|e| ImageError::Encode(src.path.to_owned(), e))?;
            let blob = Blob::new(buffer, mime::IMAGE_STAR, true);
            Ok::<_, ImageError>((src.path.to_owned(), blob))
        })
        .collect::<Result<HashMap<_, _>, _>>()?;
    Ok(blobs)
}
