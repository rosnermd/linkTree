// Parse markdown content and extract category data
function parseMarkdownCategories(markdownContent) {
    const lines = markdownContent.split('\n');
    const data = {
        profile: {},
        categories: []
    };
    
    let currentSection = null;
    let currentCategory = null;
    let currentLink = null;
    
    for (let line of lines) {
        line = line.trim();
        
        // Skip empty lines and main header
        if (!line || line === '# Categories Configuration') continue;
        
        // Profile section
        if (line === '## Profile') {
            currentSection = 'profile';
            continue;
        }
        
        // Categories section
        if (line === '## Categories') {
            currentSection = 'categories';
            continue;
        }
        
        // Category headers (### Category Name)
        if (line.startsWith('### ') && currentSection === 'categories') {
            if (currentCategory) {
                data.categories.push(currentCategory);
            }
            currentCategory = {
                name: line.substring(4),
                icon: '',
                links: []
            };
            continue;
        }
        
        // Profile icons
        if (currentSection === 'profile' && line.startsWith('- **')) {
            const match = line.match(/- \*\*(.*)\*\*: (.*)/);
            if (match) {
                const key = match[1].toLowerCase().replace(' ', '_');
                data.profile[key] = match[2];
            }
            continue;
        }
        
        // Category icon
        if (currentCategory && line.startsWith('- **Category Icon**:')) {
            currentCategory.icon = line.substring(20).trim();
            continue;
        }
        
        // Links section header
        if (line === '- **Links**:') {
            continue;
        }
        
        // Link name
        if (line.startsWith('  - **') && line.endsWith('**')) {
            if (currentLink) {
                currentCategory.links.push(currentLink);
            }
            currentLink = {
                name: line.substring(6, line.length - 2),
                icon: '',
                url: ''
            };
            continue;
        }
        
        // Link icon
        if (currentLink && line.startsWith('    - Icon:')) {
            currentLink.icon = line.substring(11).trim();
            continue;
        }
        
        // Link URL
        if (currentLink && line.startsWith('    - URL:')) {
            currentLink.url = line.substring(10).trim();
            continue;
        }
    }
    
    // Add the last category if exists
    if (currentCategory) {
        if (currentLink) {
            currentCategory.links.push(currentLink);
        }
        data.categories.push(currentCategory);
    }
    
    return data;
}

// Load and render categories
async function loadCategories() {
    try {
        const response = await fetch('categories.md');
        const markdownContent = await response.text();
        const data = parseMarkdownCategories(markdownContent);
        
        renderProfile(data.profile);
        renderCategories(data.categories);
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Render profile section
function renderProfile(profile) {
    // Update social profile icon
    const socialIcon = document.querySelector('.social-links img');
    if (socialIcon && profile.social_profile_icon) {
        socialIcon.src = profile.social_profile_icon;
    }
    
    // Update location icon
    const locationIcon = document.querySelector('.location img');
    if (locationIcon && profile.location_icon) {
        locationIcon.src = profile.location_icon;
    }
}

// Render categories
function renderCategories(categories) {
    const container = document.querySelector('.categories');
    if (!container) return;
    
    container.innerHTML = ''; // Clear existing content
    
    categories.forEach(category => {
        const categoryElement = document.createElement('div');
        categoryElement.className = 'category';
        
        // Category header
        const headerElement = document.createElement('div');
        headerElement.className = 'category-header';
        headerElement.innerHTML = `
            <img src="${category.icon}" alt="${category.name}" width="24" height="24">
            <h3>${category.name}</h3>
        `;
        categoryElement.appendChild(headerElement);
        
        // Category links
        const linksElement = document.createElement('div');
        linksElement.className = 'category-links';
        
        category.links.forEach(link => {
            const linkElement = document.createElement('a');
            linkElement.href = link.url;
            linkElement.className = 'link';
            linkElement.target = '_blank';
            linkElement.rel = 'noopener noreferrer';
            
            linkElement.innerHTML = `
                <img src="${link.icon}" alt="${link.name}" width="20" height="20">
                <span>${link.name}</span>
                <img src="https://cdn-icons-png.flaticon.com/512/318/318476.png" alt="External link" width="16" height="16" class="external-icon">
            `;
            
            linksElement.appendChild(linkElement);
        });
        
        categoryElement.appendChild(linksElement);
        container.appendChild(categoryElement);
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', loadCategories);