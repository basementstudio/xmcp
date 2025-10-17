export const vertexShader = `
  uniform float time;
  uniform float frequencyAmplitude;
  uniform float frequencySpeed;
  
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  
  void main() {
    vUv = uv;
    
    // Add frequency-based wave animation
    // This creates a dot pattern effect across the image
    float waveX = sin(position.x * 3.0 + time * frequencySpeed);
    float waveY = sin(position.y * 3.0 + time * frequencySpeed * 0.7);
    float wave = waveX * waveY;
    float frequencyDisplacement = wave * frequencyAmplitude;
    
    // Displace along the z-axis (normal to the plane)
    vec3 displaced = position + vec3(0.0, 0.0, frequencyDisplacement);
    
    vNormal = normalize(normalMatrix * normal);
    vPosition = displaced;
    vWorldPosition = (modelMatrix * vec4(displaced, 1.0)).xyz;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  }
`;

export const fragmentShader = `
  varying vec2 vUv;
  
  uniform sampler2D imageTexture;
  uniform float contrastPower;
  uniform float brightness;
  uniform float blackThreshold;
  
  void main() {
    // Get the image color
    vec4 textureColor = texture2D(imageTexture, vUv);
    vec3 baseColor = textureColor.rgb;
    
    // Calculate luminance for threshold
    float luminance = dot(baseColor, vec3(0.299, 0.587, 0.114));
    
    // Apply black threshold
    if (luminance < blackThreshold) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
      return;
    }
    
    // Apply contrast: shift to center, apply power, shift back
    vec3 contrastedColor = pow(baseColor, vec3(contrastPower));
    
    // Apply brightness
    vec3 finalColor = contrastedColor * brightness;
    
    gl_FragColor = vec4(finalColor, textureColor.a);
  }
`;

