const CategoryTabs = ({ categories, activeCategory, onCategoryChange }) => {
  return (
    <div className="category-tabs">
      <ul className="nav nav-tabs">
        {categories.map((category) => (
          <li className="nav-item" key={category}>
            <a
              className={`nav-link ${
                activeCategory === category ? "active" : ""
              }`}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onCategoryChange(category);
              }}
            >
              {category}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CategoryTabs; // ✅ Now it's a default export
