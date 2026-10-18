import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  MessageCircle,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Tags,
  Trash2,
  Truck,
} from 'lucide-react'
import { defaultProducts } from './lib/defaultProducts.js'
import {
  deleteCategory,
  deleteProduct,
  getCategories,
  getProducts,
  saveCategory,
  saveProduct,
} from './lib/api.js'
import './App.css'

const defaultCategories = [
  'College Events',
  'Festivals',
  'Daily Wear',
  'Hackathons',
  'Cultural Clubs',
  'Limited Edition',
]

const emptyForm = {
  id: '',
  code: '',
  name: '',
  category: defaultCategories[0],
  price: '',
  oldPrice: '',
  image: '',
  description: '',
  sizes: 'S,M,L,XL',
  colors: 'Black,White',
  featured: false,
  stock: 1,
}

const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'campusadmin'
const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '919876543210'

function App() {
  const [products, setProducts] = useState(defaultProducts)
  const [categories, setCategories] = useState(defaultCategories)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAdminOpen, setIsAdminOpen] = useState(false)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [categoryDraft, setCategoryDraft] = useState('')
  const [editingCategory, setEditingCategory] = useState(null)
  const [showDiscountPopup, setShowDiscountPopup] = useState(() => {
    try {
      return !JSON.parse(localStorage.getItem('printora-discount-hidden') || 'false')
    } catch {
      return true
    }
  })

  const heroSlides = useMemo(
    () => [
      {
        title: 'Campus-ready drops',
        subtitle: 'Fresh merch for fests, clubs, and everyday style.',
        image:
          'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1600&q=80',
      },
      {
        title: 'Fest-first looks',
        subtitle: 'Stand out in every event lineup and team photo.',
        image:
          'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1600&q=80',
      },
      {
        title: 'Daily wear comfort',
        subtitle: 'Lightweight, premium fits designed for campus life.',
        image:
          'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1600&q=80',
      },
      {
        title: 'Tech club energy',
        subtitle: 'Minimal, bold, and crafted for hackathons and meetups.',
        image:
          'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1600&q=80',
      },
      {
        title: 'Limited edition runs',
        subtitle: 'Collector drops for clubs, festivals, and special events.',
        image:
          'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1600&q=80',
      },
    ],
    [],
  )

  const categoryOptions = useMemo(() => ['All', ...categories], [categories])

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === 'All' || product.category === selectedCategory
      const query = search.trim().toLowerCase()
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.code.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query)

      return matchesCategory && matchesSearch
    })
  }, [products, search, selectedCategory])

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / 6))
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * 6,
    currentPage * 6,
  )

  const featuredProducts = useMemo(
    () => products.filter((product) => product.featured).slice(0, 3),
    [products],
  )

  const loadCategories = async () => {
    try {
      const nextCategories = await getCategories()
      setCategories(nextCategories)
      setForm((currentForm) => ({
        ...currentForm,
        category: currentForm.category || nextCategories[0] || defaultCategories[0],
      }))
    } catch (loadError) {
      console.warn('Categories fallback used', loadError)
      setCategories(defaultCategories)
    }
  }

  const loadProducts = async () => {
    setLoading(true)
    try {
      const data = await getProducts()
      setProducts(data)
      setError('')
    } catch (loadError) {
      setProducts(defaultProducts)
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadProducts()
      void loadCategories()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    const slideTimer = window.setInterval(() => {
      setCurrentSlide((slide) => (slide + 1) % heroSlides.length)
    }, 5000)

    return () => window.clearInterval(slideTimer)
  }, [heroSlides.length])

  const handleBuyNow = (product) => {
    const message = `Hello, I want to buy ${product.name} (${product.code}). Price: ₹${product.price}. Please share size and delivery details.`
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleFormChange = (event) => {
    const { name, value, checked, type } = event.target
    setForm((currentForm) => ({
      ...currentForm,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const resetForm = () => {
    setForm({ ...emptyForm, category: categories[0] || defaultCategories[0] })
  }

  const handleUnlockAdmin = (event) => {
    event.preventDefault()
    const enteredPassword = event.target.password.value.trim()

    if (enteredPassword === adminPassword) {
      localStorage.setItem('printora-admin-key', adminPassword)
      setIsUnlocked(true)
      setIsAdminOpen(true)
      setSuccess('Admin access granted.')
      setError('')
      return
    }

    setError('Incorrect admin password.')
  }

  const handleSubmitProduct = async (event) => {
    event.preventDefault()

    if (!form.code || !form.name || !form.category || !form.price) {
      setError('Please complete the required product fields.')
      return
    }

    const adminKey = localStorage.getItem('printora-admin-key') || adminPassword
    const payload = {
      ...form,
      id: form.id || form.code,
      price: Number(form.price),
      oldPrice: Number(form.oldPrice || 0),
      stock: Number(form.stock || 1),
      featured: Boolean(form.featured),
      image:
        form.image ||
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80',
    }

    try {
      await saveProduct(payload, adminKey)
      setSuccess(payload.id ? 'Product updated successfully.' : 'Product added successfully.')
      setError('')
      resetForm()
      await loadProducts()
    } catch (saveError) {
      setError(saveError.message)
    }
  }

  const handleEditProduct = (product) => {
    setForm({
      ...product,
      price: product.price,
      oldPrice: product.oldPrice || '',
      stock: product.stock || 1,
    })
    setIsUnlocked(true)
    setIsAdminOpen(true)
  }

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Delete this product from the store?')) {
      return
    }

    const adminKey = localStorage.getItem('printora-admin-key') || adminPassword

    try {
      await deleteProduct(productId, adminKey)
      setSuccess('Product deleted successfully.')
      setError('')
      await loadProducts()
    } catch (deleteError) {
      setError(deleteError.message)
    }
  }

  const handleCategorySubmit = async (event) => {
    event.preventDefault()

    const trimmed = categoryDraft.trim()
    if (!trimmed) {
      setError('Category name cannot be empty.')
      return
    }

    const adminKey = localStorage.getItem('printora-admin-key') || adminPassword
    const categoryValue = trimmed

    try {
      const savedCategory = await saveCategory(
        editingCategory ? { id: editingCategory, name: categoryValue } : { name: categoryValue },
        adminKey,
      )

      const updated = Array.isArray(savedCategory)
        ? savedCategory
        : [savedCategory, ...categories].filter(Boolean)

      const formattedCategories = updated
        .map((item) => (typeof item === 'string' ? item : item.name))
        .filter(Boolean)

      setCategories(formattedCategories)
      setCategoryDraft('')
      setEditingCategory(null)
      setSuccess(editingCategory ? 'Category updated successfully.' : 'Category added successfully.')
      setError('')
      setForm((currentForm) => ({ ...currentForm, category: categoryValue }))
    } catch (categoryError) {
      setError(categoryError.message)
    }
  }

  const handleEditCategory = (categoryName) => {
    setEditingCategory(categoryName)
    setCategoryDraft(categoryName)
  }

  const handleDeleteCategory = async (categoryName) => {
    if (!window.confirm(`Delete category "${categoryName}"?`)) {
      return
    }

    const adminKey = localStorage.getItem('printora-admin-key') || adminPassword

    try {
      await deleteCategory(categoryName, adminKey)
      const nextCategories = categories.filter((category) => category !== categoryName)
      setCategories(nextCategories)
      if (selectedCategory === categoryName) {
        setSelectedCategory('All')
      }
      setSuccess('Category deleted successfully.')
      setError('')
    } catch (categoryError) {
      setError(categoryError.message)
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-wrap">
          <div className="brand-mark">P</div>
          <div className="brand-copy">
            <div className="brand-name">Printora</div>
            <div className="promo-note">Social Media Followers get Special Discounts on Checkout</div>
          </div>
        </div>

        <nav className="nav-links" aria-label="Main navigation">
          <a href="#shop">Shop</a>
          <a href="#featured">Featured</a>
          <a href="#why-us">Why us</a>
          <button type="button" className="admin-toggle" onClick={() => setIsAdminOpen(true)}>
            Admin
          </button>
        </nav>
      </header>

      <main>
        <section className="hero-section">
          <div className="hero-copy">
            <span className="eyebrow">
              <Sparkles size={16} /> Campus-ready drops
            </span>
            <h1>Wear your college pride with confidence.</h1>
            <p>
              Premium tees, event merch, and daily-fit essentials designed for students,
              clubs, and campus culture.
            </p>
            <div className="hero-actions">
              <a href="#shop" className="primary-btn">
                Shop now <ArrowRight size={18} />
              </a>
              <button type="button" className="secondary-btn" onClick={() => setIsAdminOpen(true)}>
                Manage products
              </button>
            </div>
            <div className="hero-stats">
              <div>
                <strong>2k+</strong>
                <span>Happy buyers</span>
              </div>
              <div>
                <strong>48h</strong>
                <span>Fast dispatch</span>
              </div>
              <div>
                <strong>4.9/5</strong>
                <span>Student rating</span>
              </div>
            </div>
          </div>

          <div className="hero-visual" aria-label="Featured campus merch slideshow">
            <div className="hero-slider-track" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
              {heroSlides.map((slide) => (
                <div className="hero-slide" key={slide.title}>
                  <img src={slide.image} alt={slide.title} />
                  <div className="slide-overlay">
                    <span>{slide.title}</span>
                    <p>{slide.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="hero-slider-nav" aria-label="Slide navigation">
              {heroSlides.map((slide, index) => (
                <button
                  key={slide.title}
                  type="button"
                  className={index === currentSlide ? 'dot active' : 'dot'}
                  aria-label={`Go to slide ${index + 1}`}
                  onClick={() => setCurrentSlide(index)}
                />
              ))}
            </div>
            <div className="visual-badge badge-top">New drop</div>
            <div className="visual-badge badge-bottom">Festive fit</div>
          </div>
        </section>

        <section className="trust-strip" id="why-us">
          <div>
            <Truck size={18} /> Campus delivery
          </div>
          <div>
            <ShieldCheck size={18} /> Secure bulk orders
          </div>
          <div>
            <Tags size={18} /> Custom event merch
          </div>
        </section>

        <section className="featured-section" id="featured">
          <div className="section-heading">
            <div>
              <span className="eyebrow dark">Best picks</span>
              <h2>Trending this week</h2>
            </div>
          </div>

          <div className="featured-grid">
            {featuredProducts.map((product) => (
              <article className="feature-card" key={product.id || product.code}>
                <img src={product.image} alt={product.name} />
                <div className="feature-copy">
                  <span className="mini-tag">{product.category}</span>
                  <h3>{product.name}</h3>
                  <div className="pricing-row">
                    <strong>₹{product.price}</strong>
                    <span>₹{product.oldPrice}</span>
                  </div>
                  <button type="button" onClick={() => handleBuyNow(product)}>
                    Buy Now
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="shop-section" id="shop">
          <div className="section-heading shop-header">
            <div>
              <span className="eyebrow dark">Our collection</span>
              <h2>Find your campus fit</h2>
            </div>

            <label className="search-box" aria-label="Search products">
              <Search size={16} />
              <input
                type="text"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setCurrentPage(1)
                }}
                placeholder="Search tees, codes, category"
              />
            </label>
          </div>

          <div className="category-row" role="tablist" aria-label="Filter products by category">
            {categoryOptions.map((category) => (
              <button
                key={category}
                type="button"
                className={category === selectedCategory ? 'category-tab active' : 'category-tab'}
                onClick={() => {
                  setSelectedCategory(category)
                  setCurrentPage(1)
                }}
              >
                {category}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="loading-state">Loading collection...</div>
          ) : (
            <>
              <div className="product-grid">
                {paginatedProducts.map((product) => (
                  <article className="product-card" key={product.id || product.code}>
                    <div className="product-image-wrap">
                      <img src={product.image} alt={product.name} />
                      {product.featured && <span className="product-badge">Featured</span>}
                    </div>

                    <div className="product-body">
                      <div className="product-topline">
                        <span className="mini-tag">{product.category}</span>
                        <span className="stock">{product.stock} left</span>
                      </div>

                      <h3>{product.name}</h3>
                      <p className="product-code">Code: {product.code}</p>
                      <p className="product-description">{product.description}</p>

                      <div className="meta-row">
                        <span>Sizes: {product.sizes}</span>
                        <span>Colors: {product.colors}</span>
                      </div>

                      <div className="price-box">
                        <strong>₹{product.price}</strong>
                        <span>₹{product.oldPrice}</span>
                      </div>

                      <div className="action-row">
                        <button type="button" className="buy-btn" onClick={() => handleBuyNow(product)}>
                          <MessageCircle size={16} /> Buy now
                        </button>
                        <button
                          type="button"
                          className="ghost-btn"
                          onClick={() => handleEditProduct(product)}
                        >
                          <Pencil size={16} /> Edit
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="pagination-row" aria-label="Product pagination">
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  <span>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}

          {!loading && filteredProducts.length === 0 && (
            <div className="empty-state">No products found. Try another search.</div>
          )}
        </section>
      </main>

      <footer className="site-footer">
        <div>
          <div className="brand-name">Printora</div>
          <p>Built for campus events, clubs, and everyday student style.</p>
        </div>
        <div className="footer-meta">
          <span><Star size={14} /> Trusted by student communities</span>
          <span><ShoppingBag size={14} /> Bulk orders available</span>
        </div>
      </footer>

      {showDiscountPopup && (
        <div className="discount-popup" role="dialog" aria-modal="true" aria-label="Discount offer">
          <div className="discount-card">
            <button
              type="button"
              className="close-discount"
              aria-label="Close discount popup"
              onClick={() => {
                setShowDiscountPopup(false)
                localStorage.setItem('printora-discount-hidden', 'true')
              }}
            >
              ×
            </button>
            <span className="discount-kicker">Special offer</span>
            <h3>Social Media Followers get Special Discounts on Checkout</h3>
            <p>Follow us and unlock exclusive student pricing at checkout.</p>
          </div>
        </div>
      )}

      {isAdminOpen && (
        <div className="modal-backdrop" onClick={() => setIsAdminOpen(false)}>
          <div className="admin-modal" onClick={(event) => event.stopPropagation()}>
            {!isUnlocked ? (
              <form className="unlock-form" onSubmit={handleUnlockAdmin}>
                <div className="modal-header">
                  <h3>Admin access</h3>
                  <button type="button" className="close-btn" onClick={() => setIsAdminOpen(false)}>
                    ×
                  </button>
                </div>
                <label>
                  Password
                  <input type="password" name="password" placeholder="Enter admin password" />
                </label>
                <button type="submit" className="primary-btn full-width">
                  Unlock dashboard
                </button>
              </form>
            ) : (
              <form className="product-form" onSubmit={handleSubmitProduct}>
                <div className="modal-header">
                  <h3>{form.id ? 'Edit product' : 'Add new product'}</h3>
                  <button type="button" className="close-btn" onClick={() => setIsAdminOpen(false)}>
                    ×
                  </button>
                </div>

                {error && <div className="status error">{error}</div>}
                {success && <div className="status success">{success}</div>}

                <div className="field-grid">
                  <label>
                    Product code
                    <input name="code" value={form.code} onChange={handleFormChange} placeholder="CT-1007" />
                  </label>
                  <label>
                    Product name
                    <input name="name" value={form.name} onChange={handleFormChange} placeholder="Freshers Crew Tee" />
                  </label>
                  <label>
                    Category
                    <input name="category" value={form.category} onChange={handleFormChange} />
                  </label>
                  <label>
                    Price
                    <input type="number" name="price" value={form.price} onChange={handleFormChange} />
                  </label>
                  <label>
                    Old price
                    <input type="number" name="oldPrice" value={form.oldPrice} onChange={handleFormChange} />
                  </label>
                  <label>
                    Stock
                    <input type="number" name="stock" value={form.stock} onChange={handleFormChange} />
                  </label>
                  <label className="wide-field">
                    Image URL
                    <input name="image" value={form.image} onChange={handleFormChange} placeholder="https://..." />
                  </label>
                  <label className="wide-field">
                    Description
                    <textarea name="description" value={form.description} onChange={handleFormChange} rows="3" />
                  </label>
                  <label className="wide-field">
                    Sizes
                    <input name="sizes" value={form.sizes} onChange={handleFormChange} />
                  </label>
                  <label className="wide-field">
                    Colors
                    <input name="colors" value={form.colors} onChange={handleFormChange} />
                  </label>
                </div>

                <label className="checkbox-row">
                  <input type="checkbox" name="featured" checked={form.featured} onChange={handleFormChange} />
                  Mark as featured
                </label>

                <div className="form-actions">
                  <button type="button" className="secondary-btn" onClick={resetForm}>
                    <Plus size={16} /> New
                  </button>
                  <button type="submit" className="primary-btn">
                    {form.id ? 'Save product' : 'Add product'}
                  </button>
                </div>

                <div className="category-manager">
                  <h4>Manage categories</h4>
                  <form onSubmit={handleCategorySubmit} className="category-form">
                    <input
                      type="text"
                      value={categoryDraft}
                      onChange={(event) => setCategoryDraft(event.target.value)}
                      placeholder="Add or edit a category"
                    />
                    <button type="submit" className="primary-btn">
                      {editingCategory ? 'Update' : 'Add'}
                    </button>
                  </form>

                  <div className="category-list">
                    {categories.map((category) => (
                      <div className="admin-row" key={category}>
                        <div>
                          <strong>{category}</strong>
                        </div>
                        <div className="row-actions">
                          <button type="button" onClick={() => handleEditCategory(category)}>
                            <Pencil size={14} />
                          </button>
                          <button type="button" onClick={() => handleDeleteCategory(category)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="admin-list">
                  <h4>Manage current products</h4>
                  {products.map((product) => (
                    <div className="admin-row" key={product.id || product.code}>
                      <div>
                        <strong>{product.name}</strong>
                        <span>{product.code}</span>
                      </div>
                      <div className="row-actions">
                        <button type="button" onClick={() => handleEditProduct(product)}>
                          <Pencil size={14} />
                        </button>
                        <button type="button" onClick={() => handleDeleteProduct(product.id || product.code)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default App
