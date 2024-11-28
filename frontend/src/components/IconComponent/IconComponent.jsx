import React from "react";
import SVG from "react-inlinesvg";
import PropTypes from "prop-types";
import style from "./IconComponent.module.scss";

const sizes = {
  small: 16,
  medium: 24,
  large: 32,
};

function IconComponent({
  src,
  color = "default",
  size,
  title,
  height = 16,
  width = 16,
  loader = true,
  rotate = 0,
  classname,
  onclick,
  ref,
}) {
  // interactive element,
  if (onclick)
    return (
      <button
        style={{
          width: `${sizes[size] ? sizes[size] : width}px`,
          height: `${sizes[size] ? sizes[size] : height}px`,
        }}
        onClick={onclick}
      >
        <SVG
          cacheRequests
          loader={
            loader && (
              <span
                className={`animate-pulse rounded-sm`}
                style={{
                  background: "gray",
                  width: `${sizes[size] ? sizes[size] : width}px`,
                  height: `${sizes[size] ? sizes[size] : height}px`,
                  rotate: rotate,
                }}
              ></span>
            )
          }
          src={typeof src === "string" ? src : src.src}
          title={title}
          width={sizes[size] ? sizes[size] : width}
          height={sizes[size] ? sizes[size] : height}
          className={`${classname} ${style[color]}`}
        />
      </button>
    );
  // not interactive element
  return (
    <SVG
      cacheRequests
      loader={
        loader && (
          <span
            className={`animate-pulse rounded-sm`}
            style={{
              background: "gray",
              width: `${sizes[size] ? sizes[size] : width}px`,
              height: `${sizes[size] ? sizes[size] : height}px`,
              rotate: rotate,
            }}
          ></span>
        )
      }
      src={typeof src === "string" ? src : src.src}
      title={title}
      width={sizes[size] ? sizes[size] : width}
      height={sizes[size] ? sizes[size] : height}
      className={`${classname} ${style[color]}`}
    />
  );
}

export default IconComponent;

IconComponent.propTypes = {
  src: PropTypes.string.isRequired,
  color: PropTypes.oneOf(["primary", "secondary", "default", "danger", 'white']),
  size: PropTypes.oneOf(["small", "medium", "large"]),
  title: PropTypes.string,
  height: PropTypes.number,
  width: PropTypes.number,
  loader: PropTypes.bool,
  rotate: PropTypes.oneOfType([
    PropTypes.oneOf([0, 45, 90, 135, 180, 225, 270, 315, 360]),
    PropTypes.number,
  ]),
  classname: PropTypes.string,
  onclick: PropTypes.func,
};
