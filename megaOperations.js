const fetch = require('node-fetch');

class MegaOperations {
  constructor(storage, logger) {
    this.storage = storage;
    this.logger = logger;
  }

  async uploadToMega(attachment, genre, collectionName, fullFileName) {
    try {
      // Verify storage is ready
      if (!this.storage?.ready || !this.storage.root) {
        throw new Error('MEGA storage not initialized');
      }

      // Validate input parameters
      if (!attachment?.url || !genre || !collectionName || !fullFileName) {
        throw new Error('Missing required upload parameters');
      }

      // Fetch file content
      const response = await fetch(attachment.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch attachment: ${response.statusText}`);
      }

      const buffer = await response.buffer();
      
      // Get root folder
      const root = this.storage.root;
      
      // Create/get genre folder
      let genreFolder = await this.findOrCreateFolder(root, genre);
      
      // Create/get collection folder
      let collectionFolder = await this.findOrCreateFolder(genreFolder, collectionName);

      // Upload file with proper options
      const file = await collectionFolder.upload({
        name: fullFileName,
        size: buffer.length,
        data: buffer,
        thumbnailImage: attachment.contentType?.startsWith('image/') ? buffer : undefined
      }).complete;

      // Wait for upload to complete and file to be accessible
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate download link using file handle
      const downloadLink = await this.generateDownloadLink(file);
      
      this.logger.info(`File uploaded successfully: ${fullFileName} with link: ${downloadLink}`);
      return { 
        file,
        link: downloadLink
      };
    } catch (error) {
      this.logger.error('Upload error:', error);
      throw error;
    }
  }

  async findOrCreateFolder(parent, name) {
    try {
      // Check if folder exists
      const children = await parent.children;
      let folder = children.find(f => f.name === name);
      
      if (!folder) {
        // Create new folder
        folder = await parent.mkdir(name);
        // Wait for folder creation to propagate
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      return folder;
    } catch (error) {
      this.logger.error(`Folder error: ${name}`, error);
      throw error;
    }
  }

  async generateDownloadLink(file) {
    try {
      // Try multiple methods to generate link
      let link;

      // Method 1: Direct file link
      try {
        link = await file.link(false);
        if (link) return link;
      } catch (e) {
        this.logger.warn('Direct link generation failed:', e);
      }

      // Method 2: Storage link
      try {
        link = await this.storage.link(false, [file]);
        if (link) return link;
      } catch (e) {
        this.logger.warn('Storage link generation failed:', e);
      }

      // Method 3: Share link
      try {
        const share = await file.share();
        link = share.url;
        if (link) return link;
      } catch (e) {
        this.logger.warn('Share link generation failed:', e);
      }

      throw new Error('All link generation methods failed');
    } catch (error) {
      this.logger.error('Failed to generate download link:', error);
      return null;
    }
  }

  async browseContent(genre = null) {
    try {
      if (!this.storage?.root) {
        throw new Error('Unable to access MEGA root folder');
      }

      const folders = await this.storage.root.children;

      if (genre) {
        const genreFolder = folders.find(folder => 
          folder.name.toLowerCase() === genre.toLowerCase()
        );
        if (!genreFolder) return [];
        
        const collections = await genreFolder.children;
        return collections.map(folder => ({
          name: folder.name,
          path: `/${genre}/${folder.name}`
        }));
      }

      return folders.map(folder => ({
        name: folder.name,
        path: `/${folder.name}`
      }));
    } catch (error) {
      this.logger.error('Browse error:', error);
      throw error;
    }
  }
}

module.exports = MegaOperations;