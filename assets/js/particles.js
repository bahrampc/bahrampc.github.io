class ParticleSystem {
  constructor() {
    this.canvas = document.getElementById('particleCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.mouse = { x: 0, y: 0 };
    this.hovered = false;
    this.hoveredLine = null;
    this.hoverDistance = 20; // Increased hover detection distance
    
    this.init();
    this.animate();
    this.addEventListeners();
  }
  
  init() {
    this.resize();
    this.createParticles();
  }
  
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
  
  createParticles() {
    const numberOfParticles = (this.canvas.width * this.canvas.height) / 15000;
    
    for (let i = 0; i < numberOfParticles; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() * 2 + 1,
        speedX: (Math.random() * 2 - 1) * 0.5,
        speedY: (Math.random() * 2 - 1) * 0.5,
        color: `rgba(0, 247, 255, ${Math.random() * 0.5 + 0.1})`,
        baseSpeedX: (Math.random() * 2 - 1) * 0.5,
        baseSpeedY: (Math.random() * 2 - 1) * 0.5
      });
    }
  }
  
  addEventListeners() {
    window.addEventListener('resize', () => {
      this.resize();
      this.particles = [];
      this.createParticles();
    });
    
    window.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
      this.hovered = true;
    });
    
    window.addEventListener('mouseout', () => {
      this.hovered = false;
      this.hoveredLine = null;
    });
  }
  
  isPointNearLine(x, y, x1, y1, x2, y2) {
    const lineLength = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    const distance = Math.abs((y2 - y1) * x - (x2 - x1) * y + x2 * y1 - y2 * x1) / lineLength;
    const dotProduct = ((x - x1) * (x2 - x1) + (y - y1) * (y2 - y1)) / (lineLength * lineLength);
    
    return distance < this.hoverDistance && dotProduct >= 0 && dotProduct <= 1;
  }
  
  updateParticles() {
    this.particles.forEach(particle => {
      // Update position
      particle.x += particle.speedX;
      particle.y += particle.speedY;
      
      // Mouse interaction
      if (this.hovered) {
        const dx = this.mouse.x - particle.x;
        const dy = this.mouse.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 150) {
          const angle = Math.atan2(dy, dx);
          const force = (150 - distance) / 150;
          
          particle.speedX = particle.baseSpeedX - Math.cos(angle) * force * 0.3;
          particle.speedY = particle.baseSpeedY - Math.sin(angle) * force * 0.3;
        } else {
          // Gradually return to base speed
          particle.speedX += (particle.baseSpeedX - particle.speedX) * 0.1;
          particle.speedY += (particle.baseSpeedY - particle.speedY) * 0.1;
        }
      }
      
      // Wrap around edges
      if (particle.x < 0) particle.x = this.canvas.width;
      if (particle.x > this.canvas.width) particle.x = 0;
      if (particle.y < 0) particle.y = this.canvas.height;
      if (particle.y > this.canvas.height) particle.y = 0;
      
      // Speed limits
      const maxSpeed = 1;
      const speed = Math.sqrt(particle.speedX * particle.speedX + particle.speedY * particle.speedY);
      if (speed > maxSpeed) {
        particle.speedX = (particle.speedX / speed) * maxSpeed;
        particle.speedY = (particle.speedY / speed) * maxSpeed;
      }
    });
    
    // Update hovered line with more precise detection
    this.hoveredLine = null;
    if (this.hovered) {
      let closestDistance = Infinity;
      
      for (let i = 0; i < this.particles.length; i++) {
        for (let j = i + 1; j < this.particles.length; j++) {
          const p1 = this.particles[i];
          const p2 = this.particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 100) {
            if (this.isPointNearLine(this.mouse.x, this.mouse.y, p1.x, p1.y, p2.x, p2.y)) {
              const mouseToLineDistance = Math.abs((p2.y - p1.y) * this.mouse.x - (p2.x - p1.x) * this.mouse.y + p2.x * p1.y - p2.y * p1.x) / distance;
              if (mouseToLineDistance < closestDistance) {
                closestDistance = mouseToLineDistance;
                this.hoveredLine = { p1, p2, distance };
              }
            }
          }
        }
      }
    }
  }
  
  drawParticles() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw particles first
    this.particles.forEach(particle => {
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fillStyle = particle.color;
      this.ctx.fill();
    });
    
    // Draw connections with enhanced hover effect
    this.particles.forEach((particle, i) => {
      this.particles.forEach((otherParticle, j) => {
        if (j <= i) return;
        
        const dx = particle.x - otherParticle.x;
        const dy = particle.y - otherParticle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 100) {
          const isHovered = this.hoveredLine && 
            ((this.hoveredLine.p1 === particle && this.hoveredLine.p2 === otherParticle) ||
             (this.hoveredLine.p1 === otherParticle && this.hoveredLine.p2 === particle));
          
          this.ctx.beginPath();
          
          if (isHovered) {
            // Enhanced glow effect
            this.ctx.shadowColor = 'rgb(0, 247, 255, 0.04)';
            this.ctx.shadowBlur = 20;
            this.ctx.strokeStyle = 'rgb(0, 247, 255, 0.04)';
            this.ctx.lineWidth = 1;
            
            // Draw multiple layers for stronger glow
            for (let i = 0; i < 3; i++) {
              this.ctx.beginPath();
              this.ctx.moveTo(particle.x, particle.y);
              this.ctx.lineTo(otherParticle.x, otherParticle.y);
              this.ctx.stroke();
              this.ctx.shadowBlur -= 5;
            }
          } else {
            this.ctx.shadowBlur = 0;
            this.ctx.strokeStyle = `rgba(0, 247, 255, ${0.1 * (1 - distance / 100)})`;
            this.ctx.lineWidth = 0.5;
            this.ctx.moveTo(particle.x, particle.y);
            this.ctx.lineTo(otherParticle.x, otherParticle.y);
            this.ctx.stroke();
          }
          
          // Reset shadow
          this.ctx.shadowBlur = 0;
        }
      });
    });
  }
  
  animate() {
    this.updateParticles();
    this.drawParticles();
    requestAnimationFrame(() => this.animate());
  }
}

// Initialize particle system
document.addEventListener('DOMContentLoaded', () => {
  new ParticleSystem();
}); 