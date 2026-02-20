import React, { forwardRef, useId, useState, useEffect, useRef } from "react";
import { displacementMap, polarDisplacementMap, prominentDisplacementMap } from "./liquidGlassUtils";

const getMap = (mode) => {
    switch (mode) {
        case "standard": return displacementMap;
        case "polar": return polarDisplacementMap;
        case "prominent": return prominentDisplacementMap;
        default: return displacementMap;
    }
};

const GlassFilter = ({ id, displacementScale, aberrationIntensity, width, height, mode }) => (
    <svg style={{ position: "absolute", width: 0, height: 0 }} aria-hidden="true">
        <defs>
            <filter id={id} x="-35%" y="-35%" width="170%" height="170%" colorInterpolationFilters="sRGB">
                <feImage x="0" y="0" width="100%" height="100%" result="DISPLACEMENT_MAP" href={getMap(mode)} preserveAspectRatio="xMidYMid slice" />

                <feColorMatrix
                    in="DISPLACEMENT_MAP"
                    type="matrix"
                    values="0.3 0.3 0.3 0 0
                            0.3 0.3 0.3 0 0
                            0.3 0.3 0.3 0 0
                            0 0 0 1 0"
                    result="EDGE_INTENSITY"
                />
                <feComponentTransfer in="EDGE_INTENSITY" result="EDGE_MASK">
                    <feFuncA type="discrete" tableValues={`0 ${aberrationIntensity * 0.05} 1`} />
                </feComponentTransfer>

                <feOffset in="SourceGraphic" dx="0" dy="0" result="CENTER_ORIGINAL" />

                {/* Red channel - slightly reduced for greener tint */}
                <feDisplacementMap in="SourceGraphic" in2="DISPLACEMENT_MAP" scale={displacementScale * -1} xChannelSelector="R" yChannelSelector="B" result="RED_DISPLACED" />
                <feColorMatrix
                    in="RED_DISPLACED"
                    type="matrix"
                    values="0.8 0 0 0 0
                            0 0 0 0 0
                            0 0 0 0 0
                            0 0 0 1 0"
                    result="RED_CHANNEL"
                />

                {/* Green channel - Boosted for the greenish effect */}
                <feDisplacementMap in="SourceGraphic" in2="DISPLACEMENT_MAP" scale={displacementScale * (-1 - aberrationIntensity * 0.05)} xChannelSelector="R" yChannelSelector="B" result="GREEN_DISPLACED" />
                <feColorMatrix
                    in="GREEN_DISPLACED"
                    type="matrix"
                    values="0 0 0 0 0
                            0 1.2 0 0 0
                            0 0 0 0 0
                            0 0 0 1 0"
                    result="GREEN_CHANNEL"
                />

                {/* Blue channel - Reduced for greener tint */}
                <feDisplacementMap in="SourceGraphic" in2="DISPLACEMENT_MAP" scale={displacementScale * (-1 - aberrationIntensity * 0.1)} xChannelSelector="R" yChannelSelector="B" result="BLUE_DISPLACED" />
                <feColorMatrix
                    in="BLUE_DISPLACED"
                    type="matrix"
                    values="0 0 0 0 0
                            0 0 0 0 0
                            0 0 0.8 0 0
                            0 0 0 1 0"
                    result="BLUE_CHANNEL"
                />

                <feBlend in="GREEN_CHANNEL" in2="BLUE_CHANNEL" mode="screen" result="GB_COMBINED" />
                <feBlend in="RED_CHANNEL" in2="GB_COMBINED" mode="screen" result="RGB_COMBINED" />

                <feGaussianBlur in="RGB_COMBINED" stdDeviation={Math.max(0.1, 0.5 - aberrationIntensity * 0.1)} result="ABERRATED_BLURRED" />
                <feComposite in="ABERRATED_BLURRED" in2="EDGE_MASK" operator="in" result="EDGE_ABERRATION" />

                <feComponentTransfer in="EDGE_MASK" result="INVERTED_MASK">
                    <feFuncA type="table" tableValues="1 0" />
                </feComponentTransfer>
                <feComposite in="CENTER_ORIGINAL" in2="INVERTED_MASK" operator="in" result="CENTER_CLEAN" />
                <feComposite in="EDGE_ABERRATION" in2="CENTER_CLEAN" operator="over" />
            </filter>
        </defs>
    </svg>
);

const GlassContainer = forwardRef(({
    children, className = "", style, displacementScale = 25, blurAmount = 12, saturation = 180,
    aberrationIntensity = 2, cornerRadius = 999, padding = "24px 32px", glassSize = { width: 270, height: 69 },
    mode = "standard", overLight = false
}, ref) => {
    const filterId = useId();
    const isFirefox = /firefox/i.test(navigator.userAgent);

    const backdropStyle = {
        filter: isFirefox ? null : `url(#${filterId})`,
        backdropFilter: `blur(${(overLight ? 12 : 4) + blurAmount * 32}px) saturate(${saturation}%)`,
    };

    return (
        <div ref={ref} className={`liquid-glass-container ${className}`} style={{ ...style, cursor: 'default' }}>
            <GlassFilter mode={mode} id={filterId} displacementScale={displacementScale}
                aberrationIntensity={aberrationIntensity} width={glassSize.width} height={glassSize.height} />

            <div
                className="liquid-glass-inner"
                style={{
                    borderRadius: `${cornerRadius}px`,
                    position: "relative",
                    display: "flex", /* Switched from inline-flex to flex */
                    alignItems: "center",
                    gap: "24px",
                    padding,
                    overflow: "hidden",
                    transition: "all 0.2s ease-in-out",
                    boxShadow: overLight ? "0px 16px 70px rgba(0, 0, 0, 0.75)" : "0px 4px 16px rgba(45, 106, 79, 0.15)",
                    border: '1px solid rgba(82, 183, 136, 0.15)',
                    width: '100%',
                    height: '100%',
                    boxSizing: 'border-box'
                }}
            >
                <span
                    className="liquid-glass-warp"
                    style={{
                        ...backdropStyle,
                        position: "absolute",
                        inset: "0",
                        // Add greenish tint explicitly
                        background: 'linear-gradient(135deg, rgba(82, 183, 136, 0.25) 0%, rgba(45, 106, 79, 0.1) 100%)'
                    }}
                />
                <div
                    className="liquid-glass-content"
                    style={{
                        position: "relative",
                        zIndex: 1,
                        textShadow: overLight ? "0px 2px 12px rgba(0, 0, 0, 0)" : "0px 2px 12px rgba(0, 0, 0, 0.4)",
                        width: '100%'
                    }}
                >
                    {children}
                </div>
            </div>
        </div>
    );
});

export default function LiquidGlass({
    children, displacementScale = 50, blurAmount = 0.08, saturation = 180, aberrationIntensity = 2,
    cornerRadius = 999, className = "", padding = "24px 32px", overLight = false, style = {}, mode = "standard",
}) {
    const glassRef = useRef(null);
    const [glassSize, setGlassSize] = useState({ width: 270, height: 69 });
    const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e) => {
        if (!glassRef.current) return;
        const rect = glassRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        setMouseOffset({
            x: ((e.clientX - centerX) / rect.width) * 100,
            y: ((e.clientY - centerY) / rect.height) * 100,
        });
    };

    useEffect(() => {
        const updateGlassSize = () => {
            if (glassRef.current) {
                const rect = glassRef.current.getBoundingClientRect();
                setGlassSize({ width: rect.width || 1000, height: rect.height || 69 });
            }
        };

        updateGlassSize();
        const ro = new ResizeObserver(updateGlassSize);
        if (glassRef.current) ro.observe(glassRef.current);
        window.addEventListener("resize", updateGlassSize);
        return () => {
            window.removeEventListener("resize", updateGlassSize);
            ro.disconnect();
        };
    }, []);

    const baseStyle = { ...style, position: style.position || "relative", width: '100%', height: '100%', boxSizing: 'border-box' };
    const positionStyles = { position: "absolute", top: 0, left: 0 };

    return (
        <div style={{ position: 'relative', width: style.width || '100%', height: style.height || '100%', borderRadius: `${cornerRadius}px` }} onMouseMove={handleMouseMove}>
            <GlassContainer
                ref={glassRef} className={className} style={baseStyle} cornerRadius={cornerRadius}
                displacementScale={overLight ? displacementScale * 0.5 : displacementScale}
                blurAmount={blurAmount} saturation={saturation} aberrationIntensity={aberrationIntensity}
                glassSize={glassSize} padding={padding} overLight={overLight} mode={mode}
            >
                {children}
            </GlassContainer>

            {/* Simulated Edge Highlights responding to mouse movement - Adds true liquid volume feeling */}
            <span
                style={{
                    ...positionStyles,
                    height: glassSize.height,
                    width: glassSize.width,
                    borderRadius: `${cornerRadius}px`,
                    pointerEvents: "none",
                    mixBlendMode: "screen",
                    opacity: 0.85,
                    padding: "1px",
                    WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                    WebkitMaskComposite: "xor",
                    maskComposite: "exclude",
                    boxShadow: "0 0 0 0.5px rgba(255, 255, 255, 0.5) inset",
                    background: `linear-gradient(
                      ${135 + mouseOffset.x * 1.5}deg,
                      rgba(82, 183, 136, 0.0) 0%,
                      rgba(82, 183, 136, ${0.4 + Math.abs(mouseOffset.x) * 0.01}) ${Math.max(10, 33 + mouseOffset.y * 0.3)}%,
                      rgba(255, 255, 255, ${0.8 + Math.abs(mouseOffset.x) * 0.02}) ${Math.min(90, 66 + mouseOffset.y * 0.4)}%,
                      rgba(82, 183, 136, 0.0) 100%
                    )`,
                    transition: "background 0.1s ease-out"
                }}
            />
        </div>
    );
}
