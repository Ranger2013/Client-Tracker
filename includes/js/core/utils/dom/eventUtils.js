/**
 * Comprehensive event handling system that adapts to user behavior and device capabilities.
 * Provides:
 * - Device detection and capability assessment
 * - Typing speed monitoring and optimization
 * - Adaptive debounce/throttle with real-time delay adjustment
 * - Performance metric tracking
 */

export const DEVICE_TYPES = {
    MOBILE: 'mobile',
    TABLET: 'tablet',
    LAPTOP: 'laptop',
    DESKTOP: 'desktop'
};

// Default delays for different types of inputs
export const DEBOUNCE_DELAYS = {
    FAST: 300,      // Power users, >100 WPM
    NORMAL: 500,    // Average typing speed (40-60 WPM)
    MEDIUM: 650,    // Moderate typing speed (60-80 WPM)
    SLOW: 800,      // Slower typing, complex validations
    MOBILE: 1000,   // Mobile devices
    TABLET: 800     // Tablet devices
};

// Typing speed categories (in WPM - Words Per Minute)
const TYPING_SPEEDS = {
    POWER: 100,    // >100 WPM  -> Gets FAST delay (300ms)
    FAST: 80,      // 80-100 WPM -> Gets MEDIUM delay (650ms)
    MEDIUM: 60,    // 60-80 WPM  -> Gets NORMAL delay (500ms)
    NORMAL: 40,    // 40-60 WPM  -> Gets SLOW delay (800ms)
    SLOW: 30       // <30 WPM    -> Gets SLOW delay (800ms)
};

// Metrics tracking
let typingMetrics = {
    lastKeyTime: 0,
    keystrokes: 0,
    timeElapsed: 0,
    averageWPM: 0
};

let performanceMetrics = {
    avgInputDelay: 0,
    sampleCount: 0
};

/**
 * Updates debounce delay based on actual performance metrics
 * @param {number} actualDelay - The measured delay in milliseconds
 * @returns {number|undefined} - New delay value if adjustment needed
 */
export function updateOptimalDelay(actualDelay) {
    const startTime = performance.now();
    
    performanceMetrics.avgInputDelay = 
        (performanceMetrics.avgInputDelay * performanceMetrics.sampleCount + actualDelay) 
        / (performanceMetrics.sampleCount + 1);
    performanceMetrics.sampleCount++;
    
    // Log performance data
    console.debug('Performance metrics:', {
        avgDelay: performanceMetrics.avgInputDelay,
        samples: performanceMetrics.sampleCount,
        currentDelay: actualDelay
    });

    if (performanceMetrics.sampleCount > 10) {
        if (performanceMetrics.avgInputDelay > 100) {
            return DEBOUNCE_DELAYS.SLOW;
        } else if (performanceMetrics.avgInputDelay < 50) {
            return DEBOUNCE_DELAYS.FAST;
        }
    }
}

/**
 * Detects the user's device type and capabilities
 * @returns {Object} Device information and capabilities
 */
function detectDevice() {
    const userAgent = navigator.userAgent.toLowerCase();
    const deviceMemory = navigator?.deviceMemory || 4;
    const cpuCores = navigator?.hardwareConcurrency || 4;
    const hasTouch = (('ontouchstart' in window) || (navigator.maxTouchPoints > 0));
    
    // Device type detection
    const isMobile = /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isTablet = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/i.test(userAgent);
    const isLaptop = /macintosh|windows nt/i.test(userAgent) && hasTouch;
    
    // Performance capabilities
    const isLowPowered = deviceMemory < 4 || cpuCores < 4;
    const isHighPowered = deviceMemory >= 8 && cpuCores >= 8;
    
    return {
        type: isMobile ? DEVICE_TYPES.MOBILE 
            : isTablet ? DEVICE_TYPES.TABLET
            : isLaptop ? DEVICE_TYPES.LAPTOP
            : DEVICE_TYPES.DESKTOP,
        isLowPowered,
        isHighPowered,
        hasTouch,
        deviceMemory,
        cpuCores,
        isTouch: hasTouch,
        isMobile: isMobile || isTablet
    };
}

/**
 * Calculates typing speed based on input patterns
 * @returns {number} Estimated WPM (Words Per Minute)
 */
function calculateTypingSpeed() {
    const now = performance.now();
    if (typingMetrics.lastKeyTime > 0) {
        const timeDiff = now - typingMetrics.lastKeyTime;
        if (timeDiff < 2000) { // Only count if less than 2 seconds between keystrokes
            typingMetrics.timeElapsed += timeDiff;
            typingMetrics.keystrokes++;
            
            // Calculate WPM (assuming average word length of 5 characters)
            const minutes = typingMetrics.timeElapsed / 60000;
            typingMetrics.averageWPM = (typingMetrics.keystrokes / 5) / minutes;
        }
    }
    typingMetrics.lastKeyTime = now;
    return typingMetrics.averageWPM;
}

function getDelayForTypingSpeed(wpm) {
    if (wpm >= TYPING_SPEEDS.POWER) return DEBOUNCE_DELAYS.FAST;     // Fastest typists get shortest delay
    if (wpm >= TYPING_SPEEDS.FAST) return DEBOUNCE_DELAYS.MEDIUM;    // Fast typists get medium delay
    if (wpm >= TYPING_SPEEDS.MEDIUM) return DEBOUNCE_DELAYS.NORMAL;  // Above average typists get normal delay
    return DEBOUNCE_DELAYS.SLOW;                                     // Slower typists get longer delay
}

/**
 * Determines the appropriate debounce delay based on device type and input type
 * @param {string} [inputType='default'] - Type of input ('search', 'validation', etc.)
 * @returns {number} - Appropriate delay in milliseconds
 */
export function getOptimalDelay(inputType = 'default') {
    const device = detectDevice();
    
    // Mobile/touch specific handling
    if (device.isMobile) {
        if (inputType === 'search') {
            return device.isTouch ? DEBOUNCE_DELAYS.MOBILE : DEBOUNCE_DELAYS.NORMAL;
        }
        // For swipe/touch input, use immediate feedback
        return DEBOUNCE_DELAYS.FAST;
    }

    // For desktop, continue with typing speed checks
    const typingSpeed = calculateTypingSpeed();
    
    // Log metrics for debugging
    console.debug('Performance metrics:', {
        device: device.type,
        typingSpeed: Math.round(typingSpeed),
        inputType
    });

    // For mobile/tablet devices, prioritize device type
    if (device.type === DEVICE_TYPES.MOBILE) return DEBOUNCE_DELAYS.MOBILE;
    if (device.type === DEVICE_TYPES.TABLET) return DEBOUNCE_DELAYS.TABLET;

    // For desktop/laptop, consider typing speed
    return getDelayForTypingSpeed(typingSpeed);
}

/**
 * Creates a debounced version of a function that delays its execution until after
 * a specified delay of inactivity.
 * 
 * @param {Function} fn - The function to debounce
 * @param {number} delay - The delay in milliseconds
 * @returns {Function} - The debounced function
 * 
 * @example
 * // For validation
 * addListener('input-field', 'input', 
 *     createDebouncedHandler(validateInput, 300)
 * );
 */
export function createDebouncedHandler(fn, delay) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
}

/**
 * Creates a throttled version of a function that executes at most once per
 * specified time period.
 * 
 * @param {Function} fn - The function to throttle
 * @param {number} limit - The time limit in milliseconds
 * @returns {Function} - The throttled function
 * 
 * @example
 * // For scroll events
 * addListener(window, 'scroll',
 *     createThrottledHandler(handleScroll, 250)
 * );
 */
export function createThrottledHandler(fn, limit) {
    let inThrottle;
    return (...args) => {
        if (!inThrottle) {
            fn(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Creates a debounced handler that adapts to user's typing speed and device
 * @param {Function} fn - Function to debounce
 * @param {string} [inputType='default'] - Type of input for optimization
 */
export function createAdaptiveHandler(fn, inputType = 'default') {
    let timeoutId;
    let lastDelay = DEBOUNCE_DELAYS.NORMAL;

    return (...args) => {
        clearTimeout(timeoutId);
        
        // Get optimal delay based on current metrics
        const optimalDelay = getOptimalDelay(inputType);
        if (optimalDelay !== lastDelay) {
            lastDelay = optimalDelay;
            console.debug('Adjusted delay to:', optimalDelay);
        }

        timeoutId = setTimeout(() => {
            const start = performance.now();
            fn(...args);
            updateOptimalDelay(performance.now() - start);
        }, lastDelay);
    };
}
