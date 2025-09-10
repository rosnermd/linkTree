// Biolink Dynamic Content Loader
class BiolinkLoader {
    constructor() {
        this.config = null;
        this.init();
    }

    async init() {
        try {
            await this.loadConfig();
            this.renderProfile();
            this.renderSocialLinks();
            this.renderCategories();
        } catch (error) {
            console.error('Failed to load biolink configuration:', error);
        }
    }

    async loadConfig() {
        const response = await fetch('./config.md');
        const markdown = await response.text();
        this.config = this.parseMarkdown(markdown);
    }

    parseMarkdown(markdown) {
        const config = {
            profile: {},
            social: [],
            categories: {}
        };

        const lines = markdown.split('\n');
        let currentSection = null;
        let currentCategory = null;
        let currentItem = null;

        for (let line of lines) {
            line = line.trim();
            
            if (line.startsWith('## Profile Information')) {
                currentSection = 'profile';
            } else if (line.startsWith('## Social Links')) {
                currentSection = 'social';
            } else if (line.startsWith('## Categories')) {
                currentSection = 'categories';
            } else if (line.startsWith('### ') && currentSection === 'categories') {
                currentCategory = line.replace('### ', '');
                config.categories[currentCategory] = [];
            } else if (line.startsWith('- **') && currentSection === 'profile') {
                const match = line.match(/- \*\*(.+?)\*\*: (.+)/);
                if (match) {
                    const key = match[1].toLowerCase().replace(' ', '_');
                    config.profile[key] = match[2];
                }
            } else if (line.startsWith('- **') && currentSection === 'social') {
                const match = line.match(/- \*\*(.+?)\*\*:/);
                if (match) {
                    currentItem = { name: match[1], icon: '', url: '' };
                    config.social.push(currentItem);
                }
            } else if (line.startsWith('- **') && currentSection === 'categories' && currentCategory) {
                const match = line.match(/- \*\*(.+?)\*\*/);
                if (match) {
                    currentItem = { title: match[1], icon: '', url: '', description: '' };
                    config.categories[currentCategory].push(currentItem);
                }
            } else if (line.includes('Icon:') && currentItem) {
                const match = line.match(/Icon: (.+)/);
                if (match) currentItem.icon = match[1];
            } else if (line.includes('URL:') && currentItem) {
                const match = line.match(/URL: (.+)/);
                if (match) currentItem.url = match[1];
            } else if (line.includes('Description:') && currentItem) {
                const match = line.match(/Description: (.+)/);
                if (match) currentItem.description = match[1];
            }
        }

        return config;
    }

    renderProfile() {
        if (!this.config.profile) return;
        
        const heroOverlay = document.querySelector('.hero-overlay');
        if (heroOverlay) {
            const profileInfo = heroOverlay.querySelector('.profile-info');
            if (profileInfo) {
                profileInfo.innerHTML = `
                    <h1>${this.config.profile.name || 'Benjamin S Powell'}</h1>
                    <p>${this.config.profile.username || '@benjaminspowell'}</p>
                `;
            }
        }

        // Update hero background if specified
        if (this.config.profile.hero_image) {
            const heroSection = document.querySelector('.hero-section');
            if (heroSection) {
                heroSection.style.backgroundImage = `url('${this.config.profile.hero_image}')`;
            }
        }
    }

    renderSocialLinks() {
        const socialLinks = document.querySelector('.social-links');
        if (!socialLinks || !this.config.social) return;

        socialLinks.innerHTML = this.config.social.map(social => `
            <a href="${social.url}" class="social-link" target="_blank" rel="noopener noreferrer">
                <img src="${social.icon}" alt="${social.name}" width="20" height="20">
            </a>
        `).join('');
    }

    renderCategories() {
        const categoriesContainer = document.querySelector('.categories');
        if (!categoriesContainer || !this.config.categories) return;

        categoriesContainer.innerHTML = Object.entries(this.config.categories).map(([categoryName, items]) => `
            <div class="category">
                <h3>${categoryName}</h3>
                <div class="category-links">
                    ${items.map(item => `
                        <a href="${item.url}" class="link-card" target="_blank" rel="noopener noreferrer">
                            <div class="card-icon">
                                <img src="${item.icon}" alt="${item.title}" width="24" height="24">
                            </div>
                            <div class="card-content">
                                <div class="card-title">${item.title}</div>
                                <div class="card-subtitle">${item.description}</div>
                            </div>
                        </a>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }
}

// Initialize the biolink loader when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new BiolinkLoader();
});