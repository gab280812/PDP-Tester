# 🌱 AI-Powered Product Information Generator

An intelligent system that automates the creation of detailed plant product information from minimal input, generates professional Word documents, and provides a user-friendly web interface for managing product entries and accessing documents.

## ✨ Features

### 🤖 AI-Powered Content Generation
- **OpenAI Integration**: Uses GPT-4 to generate comprehensive product information from just a title and scientific name
- **Single Species Support**: Generate detailed info for individual plant species
- **Seed Mix Support**: Create combined information for multi-species seed mixes
- **Botanical Expertise**: AI generates scientifically accurate growing guides, FAQs, and product descriptions

### 📄 Professional Document Generation
- **Word Document Creation**: Automatically generates formatted .docx files for each product
- **Professional Layout**: Clean, organized documents with tables for growing conditions and plant characteristics
- **Batch Processing**: Generate documents for all products or individual products
- **Document Regeneration**: Update existing documents with new information

### 🌐 Modern Web Interface
- **Responsive Design**: Beautiful, mobile-friendly interface
- **Dual Functionality**: 
  - Product generation form with dynamic fields
  - Document management dashboard
- **Real-time Feedback**: Loading states, success/error messages, and progress indicators
- **File Management**: Download documents directly from the web interface

### 🔧 Technical Architecture
- **Frontend**: Modern HTML5/CSS3/JavaScript with responsive design
- **Backend**: Node.js/Express server with RESTful API endpoints
- **Document Processing**: Python with python-docx for Word document generation
- **AI Integration**: OpenAI API for content generation
- **Deployment Ready**: Configured for both local development and cloud deployment

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- Python 3.7+
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd PDP-Tester
   ```

2. **Install Node.js dependencies**
   ```bash
   npm install
   ```

3. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:3001`

## 📖 Usage Guide

### Web Interface

1. **Navigate to the "Generate Product" tab**
2. **Choose product type**:
   - **Single Species**: For individual plants (requires scientific name)
   - **Seed Mix**: For multi-species mixes (add multiple components)
3. **Fill in the form**:
   - Product Title (e.g., "California Poppy")
   - Scientific Name or Mix Components
   - Your OpenAI API key
4. **Click "Generate Product Information"**
5. **Download the generated JSON** or copy to clipboard

### Document Management

1. **Navigate to the "Product Documents" tab**
2. **View all generated documents** with file sizes and modification dates
3. **Download documents** by clicking the download button
4. **Regenerate documents** to update with latest product data
5. **Refresh the list** to see newly generated documents

### Command Line Tools

**Generate all product documents:**
```bash
python generate_product_docs.py
```

**Generate document for specific product:**
```bash
python generate_product_docs.py --product "California Poppy"
```

**Create new product with AI:**
```bash
python product_requester.py
```

## 📁 Project Structure

```
PDP-Tester/
├── 📄 index.html              # Main web interface
├── 🖥️ server.js               # Express server with API endpoints
├── 📦 package.json            # Node.js dependencies and scripts
├── 🐍 requirements.txt        # Python dependencies
├── 🤖 product_requester.py    # AI-powered product generator
├── 📝 generate_product_docs.py # Word document generator
├── 📊 products_data.json      # Product database
├── 📁 Product_Documents/      # Generated Word documents
├── 📁 api/                    # Serverless API functions
│   ├── generate-product.js    # Product generation endpoint
│   ├── list-documents.js      # Document listing endpoint
│   ├── download-document.js   # Document download endpoint
│   └── regenerate-document.js # Document regeneration endpoint
├── 📁 .github/workflows/      # GitHub Actions for deployment
└── 📄 vercel.json            # Vercel deployment configuration
```

## 🔌 API Endpoints

### Local Development Server (http://localhost:3001)

- `GET /api/list-documents` - List all generated documents
- `GET /api/download-document?file=filename.docx` - Download a specific document
- `POST /api/regenerate-document` - Regenerate a specific document
- `POST /api/generate-product` - Generate product information with AI

### Serverless Functions (for cloud deployment)

- `/api/generate-product` - AI product generation
- `/api/list-documents` - Document listing (mock data)
- `/api/download-document` - Document download (requires cloud storage)
- `/api/regenerate-document` - Document regeneration trigger

## 🌍 Deployment Options

### Local Development
```bash
npm start  # Runs on http://localhost:3001
```

### Vercel (Serverless)
```bash
npm run deploy
```

### GitHub Pages
Automatically deploys via GitHub Actions on push to main branch.

## 🔐 Security & Configuration

- **API Key Security**: OpenAI API keys are input by users and never stored
- **File Validation**: Strict filename validation prevents directory traversal
- **CORS Configuration**: Properly configured for cross-origin requests
- **Environment Variables**: Use `.env` files for production configuration

## 📋 Current Product Database

The system includes pre-generated data for 12+ native plant species and seed mixes:
- Arroyo Lupine, Blue-eyed Grass, Brittlebush
- Bush Monkeyflower, California Brittlebush
- Central Valley Pollinator Mix, Golden Yarrow
- Miniature Lupine, Purple Needlegrass
- Western Yarrow, White Sage, Yellow Lupine

---

**Built with ❤️ for native plant enthusiasts and seed companies**
