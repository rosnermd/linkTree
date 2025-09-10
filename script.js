class BiolinkLoader {
    constructor() {
        this.data = null;
    }

    async init() {
        try {
            await this.loadConfig();
            this.renderProfile();
            this.renderSocialLinks();
            this.renderCategories();
        } catch (error) {
            console.error('Failed to initialize biolink:', error);
        }
    }

    async loadConfig() {
        try {
            const response = await fetch('data.md');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const markdown = await response.text();
            this.data = this.parseMarkdown(markdown);
        } catch (error) {
            console.error('Error loading configuration:', error);
            throw error;
        }
    }

    parseMarkdown(markdown) {
        const lines = markdown.split('\n');
        const data = {
            profile: {},
            social: [],
            categories: []
        };

        let currentSection = null;
        let currentCategory = null;
        let currentSocialLink = null;
        let currentCategoryLink = null;

        for (let line of lines) {
            line = line.trim();
            if (!line) continue;

            // Section headers
            if (line === '## Profile') {
                currentSection = 'profile';
                continue;
            }
            if (line === '## Social Links') {
                currentSection = 'social';
                continue;
            }
            if (line === '## Categories') {
                currentSection = 'categories';
                continue;
            }

            // Profile data
            if (currentSection === 'profile' && line.startsWith('- **')) {
                const match = line.match(/- \*\*(.+)\*\*: (.+)/);
                if (match) {
                    const key = match[1].toLowerCase().replace(/\s+/g, '_');
                    data.profile[key] = match[2];
                }
                continue;
            }

            // Social links
            if (currentSection === 'social') {
                if (line.startsWith('- **') && line.endsWith('**:')) {
                    if (currentSocialLink) {
                        data.social.push(currentSocialLink);
                    }
                    currentSocialLink = {
                        name: line.substring(4, line.length - 3),
                        icon: '',
                        url: ''
                    };
                    continue;
                }
                if (currentSocialLink && line.startsWith('  - Icon:')) {
                    currentSocialLink.icon = line.substring(9).trim();
                    continue;
                }
                if (currentSocialLink && line.startsWith('  - URL:')) {
                    currentSocialLink.url = line.substring(8).trim();
                    continue;
                }
            }

            // Categories
            if (currentSection === 'categories') {
                if (line.startsWith('### ')) {
                    if (currentCategory) {
                        data.categories.push(currentCategory);
                    }
                    currentCategory = {
                        name: line.substring(4),
                        links: []
                    };
                    continue;
                }
                if (currentCategory && line.startsWith('- **') && line.endsWith('**:')) {
                    if (currentCategoryLink) {
                        currentCategory.links.push(currentCategoryLink);
                    }
                    currentCategoryLink = {
                        name: line.substring(4, line.length - 3),
                        icon: '',
                        url: '',
                        description: ''
                    };
                    continue;
                }
                if (currentCategoryLink && line.startsWith('  - Icon:')) {
                    currentCategoryLink.icon = line.substring(9).trim();
                    continue;
                }
                if (currentCategoryLink && line.startsWith('  - URL:')) {
                    currentCategoryLink.url = line.substring(8).trim();
                    continue;
                }
                if (currentCategoryLink && line.startsWith('  - Description:')) {
                    currentCategoryLink.description = line.substring(16).trim();
                    continue;
                }
            }
        }

        // Add last items
        if (currentSocialLink) {
            data.social.push(currentSocialLink);
        }
        if (currentCategoryLink && currentCategory) {
            currentCategory.links.push(currentCategoryLink);
        }
        if (currentCategory) {
            data.categories.push(currentCategory);
        }

        return data;
    }

    renderProfile() {
        if (!this.data || !this.data.profile) return;

        const profile = this.data.profile;
        
        // Update profile name
        const nameElement = document.querySelector('.profile-info h1');
        if (nameElement && profile.name) {
            nameElement.textContent = profile.name;
        }

        // Update username
        const usernameElement = document.querySelector('.profile-info p');
        if (usernameElement && profile.username) {
            usernameElement.textContent = profile.username;
        }

        // Update hero background image
        const heroElement = document.querySelector('.hero');
        if (heroElement && profile.hero_image) {
            heroElement.style.backgroundImage = `url('${profile.hero_image}')`;
        }
    }

    renderSocialLinks() {
        if (!this.data || !this.data.social) return;

        const socialContainer = document.querySelector('.social-links');
        if (!socialContainer) return;

        socialContainer.innerHTML = '';

        this.data.social.forEach(link => {
            const linkElement = document.createElement('a');
            linkElement.href = link.url;
            linkElement.className = 'social-link';
            linkElement.target = '_blank';
            linkElement.rel = 'noopener noreferrer';
            linkElement.innerHTML = `<img src="${link.icon}" alt="${link.name}" width="24" height="24">`;
            socialContainer.appendChild(linkElement);
        });
    }

    renderCategories() {
        if (!this.data || !this.data.categories) return;

        const categoriesContainer = document.querySelector('.categories');
        if (!categoriesContainer) return;

        categoriesContainer.innerHTML = '';

        this.data.categories.forEach(category => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'category';

            const categoryTitle = document.createElement('h3');
            categoryTitle.textContent = category.name;
            categoryDiv.appendChild(categoryTitle);

            const linksDiv = document.createElement('div');
            linksDiv.className = 'category-links';

            category.links.forEach(link => {
                const linkCard = document.createElement('a');
                linkCard.href = link.url;
                linkCard.className = 'link-card';
                linkCard.target = '_blank';
                linkCard.rel = 'noopener noreferrer';

                linkCard.innerHTML = `
                    <div class="card-icon">
                        <img src="${link.icon}" alt="${link.name}" width="24" height="24">
                    </div>
                    <div class="card-content">
                        <div class="card-title">${link.name}</div>
                        <div class="card-subtitle">${link.description}</div>
                    </div>
                `;

                linksDiv.appendChild(linkCard);
            });

            categoryDiv.appendChild(linksDiv);
            categoriesContainer.appendChild(categoryDiv);
        });
    }
}

// Initialize the biolink loader when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const loader = new BiolinkLoader();
    loader.init();
});