// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

// ------------------------------------------------------------ shared files

const ERRORS_PY = py`"""Exceptions the inventory raises.

Callers can catch InventoryError to handle every inventory problem at once,
or a specific subclass when they want to react differently.
"""


class InventoryError(Exception):
    """Base class for every inventory problem."""


class ProductNotFoundError(InventoryError):
    def __init__(self, sku):
        super().__init__(f"no product with SKU {sku!r}")
        self.sku = sku


class DuplicateProductError(InventoryError):
    def __init__(self, sku):
        super().__init__(f"a product with SKU {sku!r} already exists")
        self.sku = sku


class OutOfStockError(InventoryError):
    def __init__(self, sku, requested, available):
        super().__init__(f"cannot sell {requested} x {sku}: only {available} in stock")
        self.sku = sku
        self.requested = requested
        self.available = available
`

const REPORT_PY = py`"""Plain-text reports. Pure functions: an inventory goes in, a string comes out."""


def stock_report(inventory):
    lines = [f"{'SKU':<10} {'Product':<16} {'Qty':>4} {'Value':>9}"]
    for product in inventory:
        flag = "  <- LOW" if product.needs_restock else ""
        lines.append(
            f"{product.sku:<10} {product.name:<16} {product.quantity:>4} "
            f"{product.value:>9.2f}{flag}"
        )
    lines.append(f"Total stock value: {inventory.total_value():.2f}")
    return "\n".join(lines)
`

const MAIN_PY = py`from errors import InventoryError
from inventory import Inventory
from models import Product
from report import stock_report
from storage import load_inventory, save_inventory
from test_inventory import run_tests

DATA_FILE = "inventory.json"


def seed():
    return Inventory([
        Product("PEN-01", "Blue pen", "1.20", quantity=40, reorder_level=10),
        Product("NB-A5", "A5 notebook", "3.50", quantity=12, reorder_level=5),
        Product("MUG-01", "Coffee mug", "7.99", quantity=3, reorder_level=4),
        Product("BAG-TOTE", "Canvas tote", "12.00", quantity=6, reorder_level=2),
    ])


def demo():
    shop = seed()
    print(f"Sold 5 pens for {shop.sell('PEN-01', 5):.2f}")
    try:
        shop.sell("MUG-01", 10)
    except InventoryError as exc:
        print(f"Refused: {exc}")
    shop.restock("NB-A5", 8)
    print()
    print(stock_report(shop))
    print("Reorder:", ", ".join(p.sku for p in shop.low_stock()) or "nothing")

    save_inventory(shop, DATA_FILE)
    reloaded = load_inventory(DATA_FILE)
    print(f"Reloaded {len(reloaded)} products, identical: {list(reloaded) == list(shop)}")


def main():
    try:
        demo()
    except NotImplementedError as exc:
        print(f"[not built yet] {exc}")
    results = run_tests()
    passed = sum(ok for _, ok, _ in results)
    print(f"\nYour tests: {passed}/{len(results)} passed")
    for name, ok, error in results:
        if not ok:
            print(f"  FAIL {name}: {error}")


if __name__ == "__main__":
    main()
`

// ------------------------------------------------------------ starter

const MODELS_STARTER = py`from dataclasses import dataclass
from decimal import Decimal, InvalidOperation


def to_decimal(value):
    """Turn "1.20", 3 or 1.2 into an exact Decimal (floats go through str)."""
    if isinstance(value, bool):
        raise TypeError("price must be a number or a numeric string, not bool")
    if isinstance(value, float):
        value = str(value)
    try:
        return Decimal(value)
    except (InvalidOperation, TypeError):
        raise ValueError(f"invalid price: {value!r}") from None


@dataclass
class Product:
    sku: str
    name: str
    price: Decimal
    quantity: int = 0
    reorder_level: int = 5

    def __post_init__(self):
        self.sku = self.sku.strip().upper()
        self.price = to_decimal(self.price)
        # TODO: validate the rest (see the project requirements):
        #  - name must be a non-empty string            -> ValueError
        #  - price must not be negative                 -> ValueError
        #  - quantity and reorder_level must be int     -> TypeError
        #    (bool is not allowed) and not negative     -> ValueError

    @property
    def value(self):
        return self.price * self.quantity

    @property
    def needs_restock(self):
        return self.quantity <= self.reorder_level

    def to_dict(self):
        return {
            "sku": self.sku,
            "name": self.name,
            "price": str(self.price),
            "quantity": self.quantity,
            "reorder_level": self.reorder_level,
        }

    @classmethod
    def from_dict(cls, data):
        # TODO: build a Product from a dict made by to_dict()
        raise NotImplementedError("TODO: Product.from_dict()")
`

const INVENTORY_STARTER = py`from decimal import Decimal

from errors import DuplicateProductError, OutOfStockError, ProductNotFoundError
from models import Product


def normalise_sku(sku):
    return sku.strip().upper()


class Inventory:
    """Products indexed by SKU, plus the operations a shop needs."""

    def __init__(self, products=()):
        self._products = {}
        for product in products:
            self.add(product)

    def __len__(self):
        return len(self._products)

    def __contains__(self, sku):
        return isinstance(sku, str) and normalise_sku(sku) in self._products

    def __iter__(self):
        return iter(sorted(self._products.values(), key=lambda p: p.sku))

    def __repr__(self):
        return f"Inventory({len(self)} products)"

    def add(self, product):
        if product.sku in self._products:
            raise DuplicateProductError(product.sku)
        self._products[product.sku] = product

    def get(self, sku):
        key = normalise_sku(sku)
        try:
            return self._products[key]
        except KeyError:
            raise ProductNotFoundError(key) from None

    def remove(self, sku):
        # TODO: remove the product and return it (unknown SKU -> ProductNotFoundError)
        raise NotImplementedError("TODO: Inventory.remove()")

    def restock(self, sku, quantity):
        # TODO: add quantity units, return the new stock level
        raise NotImplementedError("TODO: Inventory.restock()")

    def sell(self, sku, quantity):
        # TODO: check, then subtract; return price * quantity as a Decimal
        raise NotImplementedError("TODO: Inventory.sell()")

    def low_stock(self):
        # TODO: products with quantity <= reorder_level, lowest quantity first
        raise NotImplementedError("TODO: Inventory.low_stock()")

    def total_value(self):
        # TODO: the sum of price * quantity for every product (a Decimal)
        raise NotImplementedError("TODO: Inventory.total_value()")
`

const STORAGE_STARTER = py`import json
import os
from pathlib import Path

from inventory import Inventory
from models import Product

FORMAT_VERSION = 1


def save_inventory(inventory, path):
    """Write the inventory as JSON, atomically (temp file + os.replace)."""
    path = Path(path)
    data = {"version": FORMAT_VERSION, "products": [p.to_dict() for p in inventory]}
    tmp = path.with_name(path.name + ".tmp")
    tmp.write_text(json.dumps(data, indent=2), encoding="utf-8")
    os.replace(tmp, path)


def load_inventory(path):
    # TODO: missing file -> empty Inventory()
    #       otherwise read the JSON, check "version", rebuild every Product
    raise NotImplementedError("TODO: load_inventory()")
`

const TESTS_HELPERS = py`"""Your tests. Plain functions whose names start with test_.

run_tests() finds and runs them; pytest would discover the very same functions.
"""
from decimal import Decimal

from errors import InventoryError, OutOfStockError, ProductNotFoundError
from inventory import Inventory
from models import Product
from storage import load_inventory, save_inventory


def make_inventory():
    """A fresh, known inventory for every test (pytest calls this a fixture)."""
    return Inventory([
        Product("PEN-01", "Blue pen", "1.20", quantity=40, reorder_level=10),
        Product("NB-A5", "A5 notebook", "3.50", quantity=4, reorder_level=5),
    ])


def expect_error(exc_type, func, *args):
    """Call func(*args) and return the exception it raised; fail if it didn't."""
    try:
        func(*args)
    except exc_type as exc:
        return exc
    raise AssertionError(f"{exc_type.__name__} was not raised")
`

const TESTS_RUNNER = py`

# ---------------------------------------------------------------- runner


def run_tests():
    """Run every test_* function in this module. Returns (name, passed, error) tuples."""
    results = []
    for name, func in sorted(globals().items()):
        if name.startswith("test_") and callable(func):
            try:
                func()
            except Exception as exc:  # a failing assert is an AssertionError
                results.append((name, False, f"{type(exc).__name__}: {exc}"))
            else:
                results.append((name, True, ""))
    return results
`

const TESTS_STARTER = TESTS_HELPERS + py`

# ---------------------------------------------------------------- tests


def test_add_and_get():
    shop = make_inventory()
    shop.add(Product("MUG-01", "Coffee mug", "7.99", quantity=3))
    assert shop.get("mug-01").name == "Coffee mug"
    assert len(shop) == 3


def test_sell_reduces_stock():
    shop = make_inventory()
    total = shop.sell("PEN-01", 5)
    assert total == Decimal("6.00")
    assert shop.get("PEN-01").quantity == 35


# TODO: write at least 4 more test functions. Ideas:
#  - selling more than the stock raises OutOfStockError AND leaves stock unchanged
#  - restock adds units; restock(sku, 0) raises ValueError
#  - low_stock() returns NB-A5 (4 <= 5) but not PEN-01
#  - total_value() == 1.20 * 40 + 3.50 * 4
#  - save_inventory + load_inventory gives back equal products
` + TESTS_RUNNER

// ------------------------------------------------------------ solution

const MODELS_SOLUTION = py`from dataclasses import dataclass
from decimal import Decimal, InvalidOperation


def to_decimal(value):
    """Turn "1.20", 3 or 1.2 into an exact Decimal (floats go through str)."""
    if isinstance(value, bool):
        raise TypeError("price must be a number or a numeric string, not bool")
    if isinstance(value, float):
        value = str(value)
    try:
        return Decimal(value)
    except (InvalidOperation, TypeError):
        raise ValueError(f"invalid price: {value!r}") from None


def check_count(field_name, value):
    """Counts are real ints (not bools, not strings) and never negative."""
    if isinstance(value, bool) or not isinstance(value, int):
        raise TypeError(f"{field_name} must be an int, got {type(value).__name__}")
    if value < 0:
        raise ValueError(f"{field_name} cannot be negative (got {value})")


@dataclass
class Product:
    sku: str
    name: str
    price: Decimal
    quantity: int = 0
    reorder_level: int = 5

    def __post_init__(self):
        if not isinstance(self.sku, str) or not self.sku.strip():
            raise ValueError("sku must be a non-empty string")
        if not isinstance(self.name, str) or not self.name.strip():
            raise ValueError("name must be a non-empty string")
        self.sku = self.sku.strip().upper()
        self.name = self.name.strip()
        self.price = to_decimal(self.price)
        if not self.price.is_finite() or self.price < 0:
            raise ValueError(f"price must be a finite amount >= 0 (got {self.price})")
        check_count("quantity", self.quantity)
        check_count("reorder_level", self.reorder_level)

    @property
    def value(self):
        return self.price * self.quantity

    @property
    def needs_restock(self):
        return self.quantity <= self.reorder_level

    def to_dict(self):
        return {
            "sku": self.sku,
            "name": self.name,
            "price": str(self.price),
            "quantity": self.quantity,
            "reorder_level": self.reorder_level,
        }

    @classmethod
    def from_dict(cls, data):
        return cls(
            sku=data["sku"],
            name=data["name"],
            price=data["price"],
            quantity=data["quantity"],
            reorder_level=data.get("reorder_level", 5),
        )
`

const INVENTORY_SOLUTION = py`from decimal import Decimal

from errors import DuplicateProductError, OutOfStockError, ProductNotFoundError
from models import Product


def normalise_sku(sku):
    return sku.strip().upper()


def check_positive(quantity):
    if isinstance(quantity, bool) or not isinstance(quantity, int):
        raise TypeError(f"quantity must be an int, got {type(quantity).__name__}")
    if quantity <= 0:
        raise ValueError(f"quantity must be positive (got {quantity})")


class Inventory:
    """Products indexed by SKU, plus the operations a shop needs."""

    def __init__(self, products=()):
        self._products = {}
        for product in products:
            self.add(product)

    def __len__(self):
        return len(self._products)

    def __contains__(self, sku):
        return isinstance(sku, str) and normalise_sku(sku) in self._products

    def __iter__(self):
        return iter(sorted(self._products.values(), key=lambda p: p.sku))

    def __repr__(self):
        return f"Inventory({len(self)} products)"

    def add(self, product):
        if product.sku in self._products:
            raise DuplicateProductError(product.sku)
        self._products[product.sku] = product

    def get(self, sku):
        key = normalise_sku(sku)
        try:
            return self._products[key]
        except KeyError:
            raise ProductNotFoundError(key) from None

    def remove(self, sku):
        product = self.get(sku)
        del self._products[product.sku]
        return product

    def restock(self, sku, quantity):
        check_positive(quantity)
        product = self.get(sku)
        product.quantity += quantity
        return product.quantity

    def sell(self, sku, quantity):
        check_positive(quantity)
        product = self.get(sku)
        if quantity > product.quantity:  # check first, change second
            raise OutOfStockError(product.sku, quantity, product.quantity)
        product.quantity -= quantity
        return product.price * quantity

    def low_stock(self):
        return sorted(
            (p for p in self._products.values() if p.needs_restock),
            key=lambda p: (p.quantity, p.sku),
        )

    def total_value(self):
        return sum((p.value for p in self._products.values()), start=Decimal("0"))
`

const STORAGE_SOLUTION = py`import json
import os
from pathlib import Path

from inventory import Inventory
from models import Product

FORMAT_VERSION = 1


def save_inventory(inventory, path):
    """Write the inventory as JSON, atomically (temp file + os.replace)."""
    path = Path(path)
    data = {"version": FORMAT_VERSION, "products": [p.to_dict() for p in inventory]}
    tmp = path.with_name(path.name + ".tmp")
    tmp.write_text(json.dumps(data, indent=2), encoding="utf-8")
    os.replace(tmp, path)


def load_inventory(path):
    path = Path(path)
    if not path.exists():
        return Inventory()
    data = json.loads(path.read_text(encoding="utf-8"))
    version = data.get("version")
    if version != FORMAT_VERSION:
        raise ValueError(f"unsupported inventory file version: {version!r}")
    return Inventory(Product.from_dict(item) for item in data["products"])
`

const TESTS_SOLUTION = TESTS_HELPERS + py`

# ---------------------------------------------------------------- tests


def test_add_and_get():
    shop = make_inventory()
    shop.add(Product("MUG-01", "Coffee mug", "7.99", quantity=3))
    assert shop.get("mug-01").name == "Coffee mug"
    assert len(shop) == 3


def test_sell_reduces_stock():
    shop = make_inventory()
    total = shop.sell("PEN-01", 5)
    assert total == Decimal("6.00")
    assert shop.get("PEN-01").quantity == 35


def test_selling_too_much_raises_and_keeps_stock():
    shop = make_inventory()
    exc = expect_error(OutOfStockError, shop.sell, "NB-A5", 5)
    assert (exc.requested, exc.available) == (5, 4)
    assert shop.get("NB-A5").quantity == 4


def test_restock_adds_units():
    shop = make_inventory()
    assert shop.restock("NB-A5", 6) == 10


def test_restock_rejects_zero():
    shop = make_inventory()
    expect_error(ValueError, shop.restock, "NB-A5", 0)


def test_unknown_sku_is_an_inventory_error():
    shop = make_inventory()
    exc = expect_error(ProductNotFoundError, shop.remove, "NOPE")
    assert isinstance(exc, InventoryError)


def test_low_stock_lists_only_products_at_or_below_reorder_level():
    shop = make_inventory()
    assert [p.sku for p in shop.low_stock()] == ["NB-A5"]


def test_total_value():
    shop = make_inventory()
    assert shop.total_value() == Decimal("1.20") * 40 + Decimal("3.50") * 4


def test_product_rejects_negative_price():
    expect_error(ValueError, Product, "X-1", "Broken", "-1")


def test_save_and_load_round_trip():
    shop = make_inventory()
    save_inventory(shop, "test_round_trip.json")
    assert list(load_inventory("test_round_trip.json")) == list(shop)
` + TESTS_RUNNER

// ------------------------------------------------------------ tests (platform)

const TESTS = [
  {
    name: 'Product stores an exact Decimal price, normalises the SKU and computes value',
    code: py`from decimal import Decimal
Product = module('models').Product
p = Product(" pen-01 ", "Blue pen", "1.20", quantity=10)
assert p.sku == "PEN-01"
assert p.price == Decimal("1.20") and isinstance(p.price, Decimal)
assert p.value == Decimal("12.00")
assert Product("A-1", "Float price", 0.1).price == Decimal("0.1"), 'floats should go through str() first'`,
  },
  {
    name: 'Product rejects invalid data (ValueError for bad values, TypeError for wrong types)',
    code: py`Product = module('models').Product
with raises(ValueError):
    Product("PEN-01", "   ", "1.20")
with raises(ValueError):
    Product("PEN-01", "Blue pen", "-0.01")
with raises(ValueError):
    Product("PEN-01", "Blue pen", "1.20", quantity=-1)
with raises(ValueError):
    Product("PEN-01", "Blue pen", "1.20", reorder_level=-3)
with raises(TypeError):
    Product("PEN-01", "Blue pen", "1.20", quantity="5")
with raises(TypeError):
    Product("PEN-01", "Blue pen", "1.20", quantity=True)`,
  },
  {
    name: 'add() and get() work, and a duplicate SKU raises DuplicateProductError',
    code: py`m, inv, err = module('models'), module('inventory'), module('errors')
shop = inv.Inventory([m.Product("PEN-01", "Blue pen", "1.20", quantity=5)])
assert shop.get("pen-01").name == "Blue pen"
assert "PEN-01" in shop and len(shop) == 1
with raises(err.DuplicateProductError):
    shop.add(m.Product("pen-01", "Another pen", "2.00"))
assert len(shop) == 1`,
  },
  {
    name: 'remove() returns the product; unknown SKUs raise ProductNotFoundError (an InventoryError)',
    code: py`m, inv, err = module('models'), module('inventory'), module('errors')
shop = inv.Inventory([m.Product("PEN-01", "Blue pen", "1.20", quantity=5)])
removed = shop.remove("PEN-01")
assert removed.sku == "PEN-01" and len(shop) == 0
with raises(err.ProductNotFoundError):
    shop.remove("PEN-01")
with raises(err.InventoryError):
    shop.get("GHOST")`,
  },
  {
    name: 'restock() adds units, returns the new level and rejects zero/negative amounts',
    code: py`m, inv = module('models'), module('inventory')
shop = inv.Inventory([m.Product("MUG-01", "Mug", "7.99", quantity=3)])
assert shop.restock("MUG-01", 7) == 10
assert shop.get("MUG-01").quantity == 10
with raises(ValueError):
    shop.restock("MUG-01", 0)
with raises(ValueError):
    shop.restock("MUG-01", -4)
assert shop.get("MUG-01").quantity == 10`,
  },
  {
    name: 'sell() lowers the stock and returns the sale total as a Decimal',
    code: py`from decimal import Decimal
m, inv = module('models'), module('inventory')
shop = inv.Inventory([m.Product("PEN-01", "Blue pen", "1.20", quantity=40)])
total = shop.sell("PEN-01", 3)
assert total == Decimal("3.60") and isinstance(total, Decimal)
assert shop.get("PEN-01").quantity == 37
assert shop.sell("PEN-01", 37) == Decimal("44.40")
assert shop.get("PEN-01").quantity == 0`,
  },
  {
    name: 'selling more than the stock raises OutOfStockError and leaves the stock unchanged',
    code: py`m, inv, err = module('models'), module('inventory'), module('errors')
shop = inv.Inventory([m.Product("MUG-01", "Mug", "7.99", quantity=3)])
with raises(err.OutOfStockError):
    shop.sell("MUG-01", 4)
assert shop.get("MUG-01").quantity == 3, 'check the stock BEFORE changing it'
try:
    shop.sell("MUG-01", 10)
except err.OutOfStockError as exc:
    assert (exc.sku, exc.requested, exc.available) == ("MUG-01", 10, 3)
assert issubclass(err.OutOfStockError, err.InventoryError)`,
  },
  {
    name: 'low_stock() lists products at or below their reorder level, lowest quantity first',
    code: py`m, inv = module('models'), module('inventory')
shop = inv.Inventory([
    m.Product("PEN-01", "Pen", "1.20", quantity=40, reorder_level=10),
    m.Product("MUG-01", "Mug", "7.99", quantity=4, reorder_level=4),
    m.Product("NB-A5", "Notebook", "3.50", quantity=1, reorder_level=5),
    m.Product("CUP-01", "Cup", "2.00", quantity=6, reorder_level=5),
])
assert [p.sku for p in shop.low_stock()] == ["NB-A5", "MUG-01"]
assert inv.Inventory().low_stock() == []`,
  },
  {
    name: 'total_value() adds up price x quantity exactly (a Decimal, 0 when empty)',
    code: py`from decimal import Decimal
m, inv = module('models'), module('inventory')
shop = inv.Inventory([
    m.Product("A-1", "Thing", "0.10", quantity=3),
    m.Product("B-2", "Other", "0.20", quantity=1),
])
assert shop.total_value() == Decimal("0.50")
assert isinstance(shop.total_value(), Decimal)
assert inv.Inventory().total_value() == 0`,
  },
  {
    name: 'save_inventory() + load_inventory() round-trip every product (prices stored as strings)',
    code: py`import json
m, inv, storage = module('models'), module('inventory'), module('storage')
shop = inv.Inventory([
    m.Product("PEN-01", "Blue pen", "1.20", quantity=40, reorder_level=10),
    m.Product("MUG-01", "Coffee mug", "7.99", quantity=3, reorder_level=4),
])
storage.save_inventory(shop, "round_trip.json")
data = json.loads(open("round_trip.json", encoding="utf-8").read())
assert data["version"] == 1
assert {"sku": "MUG-01", "name": "Coffee mug", "price": "7.99", "quantity": 3, "reorder_level": 4} in data["products"]
loaded = storage.load_inventory("round_trip.json")
assert list(loaded) == list(shop)
assert type(loaded.get("PEN-01").price).__name__ == "Decimal"`,
  },
  {
    name: 'load_inventory() of a missing file returns an empty Inventory; an unknown version is rejected',
    code: py`import json
storage = module('storage')
empty = storage.load_inventory("does_not_exist.json")
assert len(empty) == 0 and type(empty).__name__ == "Inventory"
with open("future.json", "w", encoding="utf-8") as fh:
    json.dump({"version": 99, "products": []}, fh)
with raises(ValueError):
    storage.load_inventory("future.json")`,
  },
  {
    name: 'from_dict() rebuilds a Product (and validates it)',
    code: py`from decimal import Decimal
Product = module('models').Product
p = Product.from_dict({"sku": "NB-A5", "name": "Notebook", "price": "3.50", "quantity": 4, "reorder_level": 5})
assert p == Product("NB-A5", "Notebook", Decimal("3.50"), 4, 5)
assert Product.from_dict({"sku": "X-1", "name": "Old file", "price": "1", "quantity": 2}).reorder_level == 5
with raises(ValueError):
    Product.from_dict({"sku": "X-1", "name": "Bad", "price": "-5", "quantity": 2})`,
  },
  {
    name: 'you wrote at least 6 test functions in test_inventory.py, and they all pass',
    code: py`suite = module('test_inventory')
results = suite.run_tests()
assert len(results) >= 6, f'Write at least 6 test_ functions (found {len(results)})'
failing = [f"{name}: {error}" for name, ok, error in results if not ok]
assert not failing, failing`,
  },
  {
    name: 'your tests catch a sell() that lets the stock go negative',
    code: py`inv = module('inventory')
suite = module('test_inventory')

def broken_sell(self, sku, quantity):
    product = self.get(sku)
    product.quantity -= quantity          # BUG: no stock check at all
    return product.price * quantity

original = inv.Inventory.sell
inv.Inventory.sell = broken_sell
try:
    results = suite.run_tests()
finally:
    inv.Inventory.sell = original
caught = [name for name, ok, _ in results if not ok]
assert caught, 'None of your tests failed when sell() allowed overselling. Add a test that expects OutOfStockError.'`,
  },
]

export default {
  id: 'project-inventory-system',
  kind: 'project',
  title: 'Project 5: Inventory System with Classes & Tests',
  summary: 'Build a small shop inventory from validated dataclasses, a class with clear rules, custom exceptions, JSON persistence — and the tests that prove it all works.',
  difficulty: 'intermediate',
  minutes: 120,
  prerequisites: ['classes-and-objects', 'dataclasses', 'custom-exceptions', 'json-data', 'testing-fundamentals'],
  related: ['project-expense-tracker', 'project-library-api', 'special-methods', 'container-protocols', 'properties-and-encapsulation', 'numbers-and-math', 'raising-exceptions', 'pathlib', 'pytest-basics', 'fixtures', 'tdd', 'modules-and-imports', 'serialization'],
  tags: ['project', 'inventory', 'dataclass', 'validation', '__post_init__', 'Decimal', 'custom exception', 'OutOfStockError', 'JSON', 'persistence', 'atomic write', 'os.replace', 'unit tests', 'test functions', 'mutation testing', 'classes'],
  apis: [
    { name: '@dataclass / __post_init__', summary: 'Generates __init__, __repr__ and __eq__; __post_init__ runs right after __init__ and is the place for validation.' },
    { name: 'decimal.Decimal', summary: 'Exact decimal arithmetic for money: Decimal("0.1") + Decimal("0.2") == Decimal("0.3").' },
    { name: 'sum(iterable, start=...)', summary: 'Adds items up; start=Decimal("0") makes an empty sum return a Decimal.' },
    { name: 'os.replace(src, dst)', summary: 'Renames a file over another one; used for atomic "write temp file, then swap" saves.' },
    { name: 'raise ... from None', summary: 'Raises a new exception and hides the internal one it replaced (e.g. KeyError → ProductNotFoundError).' },
  ],
  docs: [
    { label: 'dataclasses — Data Classes', url: 'https://docs.python.org/3/library/dataclasses.html' },
    { label: 'decimal — Decimal fixed point and floating point arithmetic', url: 'https://docs.python.org/3/library/decimal.html' },
    { label: 'Tutorial — User-defined exceptions', url: 'https://docs.python.org/3/tutorial/errors.html#user-defined-exceptions' },
    { label: 'json — JSON encoder and decoder', url: 'https://docs.python.org/3/library/json.html' },
    { label: 'os.replace()', url: 'https://docs.python.org/3/library/os.html#os.replace' },
    { label: 'pytest — Get started', url: 'https://docs.pytest.org/en/stable/getting-started.html' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`Every shop — a bakery, a bike store, a web shop — needs to answer the same questions: *What do we have? What's it worth? What's running low? Can I sell this?* In this project you build the engine behind those answers: an **inventory system**.`,
    py`It's small, but it's built the way real software is. A **model** (\`Product\`, a [dataclass](lesson:dataclasses)) that refuses bad data. A **class with rules** (\`Inventory\`) that never lets the stock go negative. **Custom exceptions** (\`OutOfStockError\`) that say exactly what went wrong ([custom exceptions](lesson:custom-exceptions)). **JSON persistence** so the stock survives a restart ([JSON](lesson:json-data)). And — the part beginners skip — **your own tests**, which the platform checks by deliberately breaking your code to see whether your tests notice.`,
    py`The starter already runs. Press **Run** and it tells you what's not built yet. Fill in the TODOs module by module until every check is green.`,
  ],
  why: [
    py`Up to now most of your programs have been one file of functions. Real programs are split into pieces with clear jobs, and those pieces need to *trust* each other. A \`Product\` that validates itself means no other code has to wonder "is this price negative?". An \`Inventory\` that raises \`OutOfStockError\` means the checkout code doesn't need to re-check the stock.`,
    py`Money adds a twist: \`0.1 + 0.2\` is not \`0.3\` with floats. Shops that use floats for prices end up with totals that are off by a fraction of a cent. You'll use \`Decimal\`, the standard library's exact decimal type.`,
    py`Finally, tests turn "I think it works" into "I know it works — and I'll know the moment it breaks". Writing them alongside the code is how professionals keep a growing project safe to change.`,
  ],
  eli15: [
    py`Imagine running the stock room of a school shop. You keep a card for every product: its code, name, price, how many are on the shelf, and when you should order more. That card is the \`Product\`.`,
    py`The stock room itself is the \`Inventory\`: a box of cards with rules. You can't sell 10 mugs if you only have 3 — the stock-room keeper says "No! Only 3 left" (that's \`OutOfStockError\`). At closing time you write everything in a notebook (the JSON file) so tomorrow you can pick up where you left off.`,
    py`And the tests? They're a checklist a friend runs every evening: "sell 5 pens — are there 35 left? try to sell 5 notebooks when there are 4 — did the keeper refuse?" If somebody breaks a rule, the checklist catches it.`,
  ],
  analogy: {
    title: 'The stock room and its keeper',
    body: [
      py`A well-run stock room has index cards that are always filled in properly, a keeper who follows strict rules, a logbook copied out every evening, and an inspector who checks the keeper's work. Each one does one job, which is why the whole thing is reliable.`,
    ],
    mapping: [
      ['index card', 'a Product dataclass instance'],
      ['"this card is filled in wrong" — rejected at the counter', 'validation in __post_init__ (ValueError / TypeError)'],
      ['the keeper and the card box', 'the Inventory class and its _products dict'],
      ['"only 3 left, I can\'t give you 10"', 'raise OutOfStockError(sku, requested, available)'],
      ['the evening logbook', 'save_inventory() writing JSON'],
      ['the inspector\'s checklist', 'your test_* functions'],
      ['inspector sneaking in a mistake to see if the checklist notices', 'the platform\'s "mutation" test that breaks sell() on purpose'],
    ],
  },
  visual: {
    type: 'concept-diagram',
    title: 'How the modules fit together',
    props: {
      width: 760,
      height: 340,
      nodes: [
        { id: 'main', label: 'main.py', note: 'wires it together', x: 110, y: 70, tone: 'yellow' },
        { id: 'tests', label: 'test_inventory.py', note: 'your test_* functions', x: 110, y: 270, tone: 'ink' },
        { id: 'inventory', label: 'inventory.py', note: 'Inventory: the rules', x: 380, y: 70, tone: 'blue' },
        { id: 'models', label: 'models.py', note: 'Product dataclass', x: 380, y: 270 },
        { id: 'errors', label: 'errors.py', note: 'InventoryError family', x: 640, y: 70, tone: 'red' },
        { id: 'storage', label: 'storage.py', note: 'JSON save / load', x: 640, y: 270, tone: 'kraft' },
      ],
      edges: [
        { from: 'main', to: 'inventory', label: 'sell / restock' },
        { from: 'inventory', to: 'models', label: 'holds Products' },
        { from: 'inventory', to: 'errors', label: 'raises' },
        { from: 'main', to: 'storage', label: 'save / load', dashed: true },
        { from: 'storage', to: 'models', label: 'to_dict / from_dict' },
        { from: 'tests', to: 'inventory', label: 'checks behaviour', dashed: true },
      ],
      steps: [
        { focus: ['models'], text: py`**models.py** — a \`Product\` is plain data with one job: refuse to exist in a bad state. Validation in \`__post_init__\` means every \`Product\` anywhere in the program is trustworthy.` },
        { focus: ['inventory', 'models'], edges: ['inventory->models'], text: py`**inventory.py** — \`Inventory\` keeps Products in a dict keyed by SKU and owns the *rules*: no duplicates, positive quantities only, never sell what isn't there.` },
        { focus: ['inventory', 'errors'], edges: ['inventory->errors'], text: py`When a rule is broken it raises a specific exception from **errors.py**. Every one inherits from \`InventoryError\`, so callers can catch the whole family at once.` },
        { focus: ['storage', 'models'], edges: ['storage->models', 'main->storage'], text: py`**storage.py** turns Products into JSON-friendly dicts (prices as strings, so no precision is lost) and back, writing atomically so a crash can't leave a half-written file.` },
        { focus: ['main'], edges: ['main->inventory'], text: py`**main.py** stays tiny: build an inventory, do a few operations, print the report. All logic lives in modules, so it can be imported and tested.` },
        { focus: ['tests', 'inventory'], edges: ['tests->inventory'], text: py`**test_inventory.py** holds your tests: plain functions full of \`assert\`. Each builds a fresh inventory, does one thing, and checks the result.` },
      ],
    },
    alt: 'Architecture diagram with six modules. main.py calls inventory.py (sell, restock) and storage.py (save, load). inventory.py holds Product objects from models.py and raises exceptions from errors.py. storage.py converts Products with to_dict and from_dict. test_inventory.py checks the behaviour of inventory.py.',
    caption: py`Arrows point from the module that *uses* to the module that is *used*. Notice that \`models.py\` and \`errors.py\` depend on nothing — they're the foundation.`,
  },

  requirements: [
    'models.py: a Product dataclass with sku, name, price, quantity (default 0) and reorder_level (default 5). __post_init__ strips and upper-cases the SKU, converts price to Decimal (floats via str), and raises ValueError for an empty name/SKU, a negative price or a negative count, and TypeError when quantity/reorder_level is not an int (bool is not allowed).',
    'Product.value is price × quantity; Product.needs_restock is quantity <= reorder_level; to_dict() stores the price as a string and Product.from_dict() rebuilds (and re-validates) a Product, defaulting reorder_level to 5.',
    'errors.py: InventoryError is the base class of ProductNotFoundError, DuplicateProductError and OutOfStockError; OutOfStockError has .sku, .requested and .available.',
    'inventory.py: Inventory(products=()) supports add (duplicate SKU → DuplicateProductError), get and remove (unknown SKU → ProductNotFoundError, SKU case-insensitive), len(), in and iteration sorted by SKU.',
    'restock(sku, qty) and sell(sku, qty) accept only positive ints (ValueError for 0 or less, TypeError for non-ints). restock returns the new stock level; sell returns price × qty as a Decimal and raises OutOfStockError — without changing anything — when qty is more than the stock.',
    'low_stock() returns the products with quantity <= reorder_level sorted by quantity, then SKU; total_value() returns the exact Decimal sum of every product\'s value (0 for an empty inventory).',
    'storage.py: save_inventory(inventory, path) writes {"version": 1, "products": [...]} atomically; load_inventory(path) returns an empty Inventory when the file is missing and raises ValueError for any other version.',
    'test_inventory.py: at least 6 passing test_* functions, including one that would catch a sell() that allows overselling.',
  ],
  objectives: [
    'Split a program into modules with one responsibility each, and keep main.py thin.',
    'Validate data at the boundary with a dataclass __post_init__ so invalid objects can never exist.',
    'Use Decimal for money and understand why float is the wrong tool.',
    'Design a small exception hierarchy and raise specific, informative errors.',
    'Make operations safe: check every precondition before changing state.',
    'Persist objects to JSON with an explicit, versioned format and atomic writes.',
    'Write plain test functions (arrange → act → assert), test exceptions, and judge test quality by breaking the code on purpose.',
  ],

  playground: {
    title: 'Inventory system — starter',
    objective: 'Implement the TODOs in models.py, inventory.py, storage.py and test_inventory.py until every check passes.',
    files: {
      'main.py': MAIN_PY,
      'models.py': MODELS_STARTER,
      'inventory.py': INVENTORY_STARTER,
      'errors.py': ERRORS_PY,
      'storage.py': STORAGE_STARTER,
      'report.py': REPORT_PY,
      'test_inventory.py': TESTS_STARTER,
    },
    expected: py`The starter runs but stops at the first missing piece:

\`\`\`text
[not built yet] TODO: Inventory.sell()

Your tests: 1/2 passed
  FAIL test_sell_reduces_stock: NotImplementedError: TODO: Inventory.sell()
\`\`\`

When everything is built you'll see the sales, a refusal, the stock report, the reorder list, the reload check and **Your tests: 10/10 passed** (or however many tests you wrote).`,
    tests: TESTS,
  },

  steps: [
    {
      title: '1. Plan the pieces before writing code',
      body: [
        py`Start with a list of *nouns* and *verbs* from the problem. Nouns become data: a **product** (SKU, name, price, quantity, reorder level) and the **inventory** that holds products. Verbs become methods: add, remove, restock, sell, report, save, load. Things that can go wrong become exceptions: unknown product, duplicate product, not enough stock.`,
        py`Then give each concern its own module, so each file answers one question:`,
        py`| module | answers | depends on |
|---|---|---|
| \`errors.py\` | what can go wrong? | nothing |
| \`models.py\` | what is a valid product? | nothing |
| \`inventory.py\` | what are the rules? | models, errors |
| \`storage.py\` | how is it saved? | inventory, models |
| \`report.py\` | how does it look? | (any inventory) |
| \`test_inventory.py\` | does it work? | everything |
| \`main.py\` | what happens when I press Run? | everything |`,
        py`Dependencies point *one way*: the low-level modules never import the high-level ones. That keeps imports free of cycles and lets you test \`models.py\` without touching files at all. See [modules & imports](lesson:modules-and-imports) and [project structure](lesson:project-structure).`,
        { callout: 'tip', title: 'Run it now', text: py`The starter is already a working program. Press **Run**: it prints which TODO it hit first. Work through the TODOs in the order of the table above — each step makes more of the program come alive.` },
      ],
    },
    {
      title: '2. A family of exceptions',
      body: [
        py`\`errors.py\` is finished for you, but read it closely — it's a pattern you'll reuse in every project. One **base class** (\`InventoryError\`) and specific subclasses. Each subclass builds a helpful message *and* keeps the raw facts as attributes, so code can react to them without parsing strings.`,
        { code: py`class InventoryError(Exception):
    """Base class for every inventory problem."""


class OutOfStockError(InventoryError):
    def __init__(self, sku, requested, available):
        super().__init__(f"cannot sell {requested} x {sku}: only {available} in stock")
        self.sku = sku
        self.requested = requested
        self.available = available


try:
    raise OutOfStockError("MUG-01", 10, 3)
except InventoryError as exc:          # catches the whole family
    print(exc)                         # the message
    print(exc.available)               # the facts`, lang: 'python', title: 'errors.py (excerpt)' },
        py`Why not just \`raise ValueError("not enough stock")\`? Because then a caller can't tell "out of stock" apart from "you typed a negative price" — both are \`ValueError\`. A custom type turns *what went wrong* into something code can \`except\` precisely. Read more in [custom exceptions](lesson:custom-exceptions).`,
      ],
    },
    {
      title: '3. Product: a dataclass that refuses bad data',
      body: [
        py`A [dataclass](lesson:dataclasses) writes \`__init__\`, \`__repr__\` and \`__eq__\` for you. The hook \`__post_init__\` runs right after the generated \`__init__\` — the perfect place to **normalise** (strip, upper-case, convert) and **validate** (raise if invalid).`,
        { code: py`from dataclasses import dataclass
from decimal import Decimal


def check_count(field_name, value):
    if isinstance(value, bool) or not isinstance(value, int):
        raise TypeError(f"{field_name} must be an int, got {type(value).__name__}")
    if value < 0:
        raise ValueError(f"{field_name} cannot be negative (got {value})")


@dataclass
class Product:
    sku: str
    name: str
    price: Decimal
    quantity: int = 0
    reorder_level: int = 5

    def __post_init__(self):
        if not isinstance(self.name, str) or not self.name.strip():
            raise ValueError("name must be a non-empty string")
        self.sku = self.sku.strip().upper()
        self.name = self.name.strip()
        self.price = Decimal(str(self.price))
        if self.price < 0:
            raise ValueError(f"price must be >= 0 (got {self.price})")
        check_count("quantity", self.quantity)
        check_count("reorder_level", self.reorder_level)


print(Product(" pen-01", "Blue pen", "1.20", 40))
try:
    Product("PEN-01", "Blue pen", "1.20", quantity=True)
except TypeError as exc:
    print("Rejected:", exc)`, lang: 'python', title: 'validation in __post_init__ (simplified price conversion)' },
        py`Three details worth noticing:`,
        py`- **\`bool\` is a subclass of \`int\`**, so \`isinstance(True, int)\` is \`True\`. Without the extra check, \`quantity=True\` would sneak through as 1.
- **TypeError vs ValueError.** Wrong *kind* of thing (a string where an int belongs) → \`TypeError\`. Right kind, bad *value* (−1) → \`ValueError\`. That's the convention the built-ins follow, so callers can rely on it.
- **Fields with defaults come last.** A dataclass turns the fields into \`__init__\` parameters in order, so a non-default field after a default one is a \`TypeError\` at class creation.`,
        { callout: 'warn', title: 'Why Decimal, not float', text: py`Floats are binary fractions: \`0.1 + 0.2 == 0.3\` is \`False\`. \`Decimal("0.1") + Decimal("0.2") == Decimal("0.3")\` is \`True\`. Always build Decimals from **strings** — \`Decimal(0.1)\` faithfully copies the float's binary error (\`0.1000000000000000055511151231257827021181583404541015625\`). The starter's \`to_decimal()\` sends floats through \`str()\` first for exactly this reason. See [numbers & math](lesson:numbers-and-math).` },
        py`\`value\` and \`needs_restock\` are read-only [properties](lesson:properties-and-encapsulation): computed from the fields every time, so they can never go stale.`,
      ],
    },
    {
      title: '4. Inventory: a container with rules',
      body: [
        py`\`Inventory\` stores Products in a dict keyed by SKU — an O(1) lookup instead of searching a list. The underscore in \`self._products\` says "internal: use my methods". The dunder methods make it feel like a built-in container ([container protocols](lesson:container-protocols)):`,
        { code: py`class Inventory:
    def __init__(self, products=()):
        self._products = {}
        for product in products:
            self.add(product)          # reuse the rules, even in __init__

    def __len__(self):                 # len(shop)
        return len(self._products)

    def __contains__(self, sku):       # "PEN-01" in shop
        return isinstance(sku, str) and sku.strip().upper() in self._products

    def __iter__(self):                # for product in shop: (sorted by SKU)
        return iter(sorted(self._products.values(), key=lambda p: p.sku))`, lang: 'python', title: 'the container part of inventory.py' },
        py`Note the default \`products=()\` — an empty **tuple**, which is immutable. A default of \`[]\` would be created once and shared between calls, a classic bug ([function arguments](lesson:function-arguments)).`,
        py`\`get()\` translates the dict's \`KeyError\` into a domain error. \`from None\` hides the internal \`KeyError\` from the traceback, because it's an implementation detail the caller shouldn't care about:`,
        { code: py`    def get(self, sku):
        key = normalise_sku(sku)
        try:
            return self._products[key]
        except KeyError:
            raise ProductNotFoundError(key) from None

    def remove(self, sku):
        product = self.get(sku)        # raises for unknown SKUs — for free
        del self._products[product.sku]
        return product`, lang: 'python', static: true, title: 'get() and remove()' },
        py`Now implement \`remove()\` in the starter. Reusing \`get()\` means the "unknown SKU" rule lives in exactly one place.`,
      ],
    },
    {
      title: '5. Stock movements: check first, change second',
      body: [
        py`\`restock\` and \`sell\` change state, so they're where bugs hurt most. The golden rule: **validate every precondition before mutating anything.** If you subtract first and check afterwards, an exception leaves the inventory half-updated — the sale was refused but the stock went down anyway.`,
        { code: py`def check_positive(quantity):
    if isinstance(quantity, bool) or not isinstance(quantity, int):
        raise TypeError(f"quantity must be an int, got {type(quantity).__name__}")
    if quantity <= 0:
        raise ValueError(f"quantity must be positive (got {quantity})")


class Inventory:
    ...

    def restock(self, sku, quantity):
        check_positive(quantity)
        product = self.get(sku)
        product.quantity += quantity
        return product.quantity

    def sell(self, sku, quantity):
        check_positive(quantity)                 # 1. is the request sane?
        product = self.get(sku)                  # 2. does the product exist?
        if quantity > product.quantity:          # 3. is there enough?
            raise OutOfStockError(product.sku, quantity, product.quantity)
        product.quantity -= quantity             # 4. only now: change state
        return product.price * quantity`, lang: 'python', title: 'guard clauses, then the change' },
        py`Each \`if ... raise\` at the top is a **guard clause**: it rejects bad input early, so the "happy path" at the bottom stays flat and readable.`,
        py`Why does \`sell(sku, 0)\` raise instead of quietly doing nothing? Selling zero items is almost always a bug in the *caller* (an empty form field, an off-by-one). Failing loudly finds those bugs early; silently accepting them hides them.`,
        { callout: 'note', title: 'In a real shop', text: py`Two tills selling the last mug at the same moment can both pass the check before either subtracts. A single Python process is safe here, but a multi-user system must make "check and subtract" one atomic step — for example a database \`UPDATE ... SET quantity = quantity - ? WHERE sku = ? AND quantity >= ?\` inside a transaction. See [transactions & repositories](lesson:database-patterns).` },
      ],
    },
    {
      title: '6. Reports: low stock and total value',
      body: [
        py`Reports *read* the inventory without changing it. \`low_stock()\` filters with a generator expression and sorts by a tuple key — lowest quantity first, SKU to break ties so the order is always the same:`,
        { code: py`    def low_stock(self):
        return sorted(
            (p for p in self._products.values() if p.needs_restock),
            key=lambda p: (p.quantity, p.sku),
        )

    def total_value(self):
        return sum((p.value for p in self._products.values()), start=Decimal("0"))`, lang: 'python', static: true, title: 'inventory.py (reports)' },
        py`\`sum()\` starts from the int \`0\` by default. For a non-empty inventory that's fine (\`0 + Decimal\` works), but an *empty* inventory would return the int \`0\`, not a Decimal. \`start=Decimal("0")\` makes the type consistent, which matters when other code formats or serialises the result.`,
        py`\`report.py\` is already written: it only uses \`for product in inventory\`, \`.needs_restock\`, \`.value\` and \`total_value()\` — so it works with anything shaped like an inventory ([duck typing](lesson:polymorphism-and-duck-typing)). Format specs like \`{value:>9.2f}\` work on Decimals just like floats ([f-strings](lesson:string-formatting)).`,
      ],
    },
    {
      title: '7. Persistence: JSON that survives a crash',
      body: [
        py`JSON knows strings, numbers, booleans, null, lists and objects — not \`Decimal\` (\`json.dumps\` raises \`TypeError: Object of type Decimal is not JSON serializable\`). So \`to_dict()\` stores the price as a **string**: \`"7.99"\` round-trips exactly, whereas a JSON number would come back as a float.`,
        { code: py`import json
import os
from pathlib import Path

FORMAT_VERSION = 1


def save_inventory(inventory, path):
    path = Path(path)
    data = {"version": FORMAT_VERSION, "products": [p.to_dict() for p in inventory]}
    tmp = path.with_name(path.name + ".tmp")
    tmp.write_text(json.dumps(data, indent=2), encoding="utf-8")
    os.replace(tmp, path)          # swap in the complete file in one step


def load_inventory(path):
    path = Path(path)
    if not path.exists():
        return Inventory()         # first run: nothing saved yet
    data = json.loads(path.read_text(encoding="utf-8"))
    version = data.get("version")
    if version != FORMAT_VERSION:
        raise ValueError(f"unsupported inventory file version: {version!r}")
    return Inventory(Product.from_dict(item) for item in data["products"])`, lang: 'python', static: true, title: 'storage.py' },
        py`Two production habits hide in there:`,
        py`- **Atomic write.** Writing straight to \`inventory.json\` truncates it first; a crash mid-write leaves an empty or half file, and next start-up dies with \`JSONDecodeError\`. Writing a temp file and then \`os.replace()\`-ing it over the real one means the file is either the old version or the new one — never half of each. (\`os.replace\` is atomic on POSIX when both paths are on the same filesystem.)
- **A version number.** When you later add a field (say \`supplier\`), \`load_inventory\` can see \`"version": 1\` and upgrade old files instead of crashing.`,
        py`\`Product.from_dict()\` calls the normal constructor, so loaded data goes through the same validation as everything else. **Never trust a file just because you wrote it** — people edit files by hand. More in [JSON](lesson:json-data) and [pathlib](lesson:pathlib); why not \`pickle\`? See [serialization](lesson:serialization).`,
      ],
    },
    {
      title: '8. Write your own tests',
      body: [
        py`A test is just a function that **arranges** some state, **acts** once, and **asserts** what should be true. If an \`assert\` fails it raises \`AssertionError\`, which the runner reports. That's all a test framework fundamentally is ([testing fundamentals](lesson:testing-fundamentals)).`,
        { code: py`def test_selling_too_much_raises_and_keeps_stock():
    shop = make_inventory()                                  # arrange (fresh every time)
    exc = expect_error(OutOfStockError, shop.sell, "NB-A5", 5)   # act
    assert (exc.requested, exc.available) == (5, 4)          # assert: the facts
    assert shop.get("NB-A5").quantity == 4                   # assert: nothing changed`, lang: 'python', static: true, title: 'one behaviour per test' },
        py`Good tests share a few traits:`,
        py`- **Independent.** Each builds its own inventory with \`make_inventory()\`. Tests that share one module-level object pass alone and fail together, depending on order.
- **Named after the behaviour**, so a failure reads like a bug report: \`test_selling_too_much_raises_and_keeps_stock\`.
- **They test the edges**: zero, exactly-at-the-limit (4 ≤ 5 is low stock), one-over-the-limit, empty inventory.
- **They test the unhappy path**, not just the happy one. The most important rule here — "never oversell" — is only checked by a test that *tries* to oversell.`,
        py`How do you know your tests are any good? **Break the code and see if they fail.** That's what the last platform check does: it swaps in a \`sell()\` that forgets the stock check and runs your suite. If everything still passes, your tests weren't really guarding that rule. (Tools like *mutmut* automate this idea, called **mutation testing**.)`,
        py`With pytest installed (not available in this sandbox), the very same functions run with no runner at all, and \`pytest.raises\` replaces \`expect_error\`:`,
        { code: py`import pytest
from decimal import Decimal


@pytest.fixture
def shop():
    return make_inventory()


def test_selling_too_much_raises_and_keeps_stock(shop):
    with pytest.raises(OutOfStockError, match="only 4 in stock"):
        shop.sell("NB-A5", 5)
    assert shop.get("NB-A5").quantity == 4


@pytest.mark.parametrize("bad", [0, -1, -100])
def test_restock_rejects_non_positive(shop, bad):
    with pytest.raises(ValueError):
        shop.restock("NB-A5", bad)`, lang: 'python', static: true, title: 'the pytest version (run locally)' },
        py`See [pytest basics](lesson:pytest-basics) and [fixtures](lesson:fixtures). Writing the test *before* the code is [test-driven development](lesson:tdd) — try it for the next feature.`,
      ],
    },
    {
      title: '9. Wire it up and run everything',
      body: [
        py`\`main.py\` only *uses* the modules: seed some products, sell, show a refusal, restock, print the report, save, reload and compare. It runs \`demo()\` inside \`try/except NotImplementedError\` so the half-built starter still runs, and then runs your tests and prints a summary.`,
        { code: py`def main():
    try:
        demo()
    except NotImplementedError as exc:
        print(f"[not built yet] {exc}")
    results = run_tests()
    passed = sum(ok for _, ok, _ in results)
    print(f"\nYour tests: {passed}/{len(results)} passed")`, lang: 'python', static: true, title: 'main.py (excerpt)' },
        py`\`sum(ok for ...)\` works because \`True\` counts as 1 and \`False\` as 0. The \`if __name__ == "__main__":\` guard at the bottom means importing \`main\` (as the platform's tests do) doesn't trigger a run twice — see [scripts vs modules](lesson:main-guard-and-scripts).`,
        py`When every check is green, compare your code with the solution, then pick a challenge below.`,
      ],
    },
  ],

  challenges: [
    'History: record every stock movement (sku, change, reason, timestamp in UTC) in an append-only list, and add Inventory.history(sku). Persist it too, and bump FORMAT_VERSION with a migration for version-1 files.',
    'Batch sales: add sell_many([(sku, qty), ...]) that is all-or-nothing — if any line would oversell, nothing changes. Write the test first.',
    'Command line: an argparse front end (inventory.py add/sell/restock/report --file stock.json) that loads, applies one command, and saves.',
    'Swap storage: implement SqliteStorage with the same save/load interface and run the same tests against both (see the SQL & sqlite3 lesson).',
    'Concurrency (production concern): two processes running the CLI at once can both load, both sell the last item, and both save — the second save wins and stock is wrong. Reproduce it on paper, then fix it with a lock file or a database transaction.',
    'Money (production concern): add a currency to Product and refuse to add values in different currencies; quantize prices to cents with Decimal.quantize(Decimal("0.01")).',
    'Encapsulation: make quantity impossible to set to a negative value from outside (a property with a validating setter, or a frozen dataclass plus dataclasses.replace()).',
    'Testing: port the suite to pytest with a fixture and parametrize; measure coverage with coverage.py and add tests for any untested branch.',
  ],

  solution: {
    files: {
      'main.py': MAIN_PY,
      'models.py': MODELS_SOLUTION,
      'inventory.py': INVENTORY_SOLUTION,
      'errors.py': ERRORS_PY,
      'storage.py': STORAGE_SOLUTION,
      'report.py': REPORT_PY,
      'test_inventory.py': TESTS_SOLUTION,
    },
    explanation: [
      py`**models.py** validates *everything* in \`__post_init__\`: SKU and name must be non-empty strings, the price becomes a finite, non-negative \`Decimal\`, counts must be real \`int\`s (with \`bool\` explicitly excluded) and not negative. Because \`from_dict()\` simply calls the constructor, data loaded from disk is validated by the very same code.`,
      py`**inventory.py** keeps a dict keyed by normalised SKU. \`get()\` converts \`KeyError\` into \`ProductNotFoundError\` and \`remove()\` reuses it. \`restock()\` and \`sell()\` run every check — positive int, product exists, enough stock — *before* changing \`quantity\`, so a refused sale changes nothing. Reports use \`sorted()\` with a tuple key for a deterministic order and \`sum(..., start=Decimal("0"))\` for an exact, consistently typed total.`,
      py`**storage.py** writes a versioned JSON document to a temp file and swaps it in with \`os.replace()\`, so a crash can't leave a half-written file. Loading treats a missing file as "no stock yet" and rejects versions it doesn't understand instead of guessing.`,
      py`**test_inventory.py** has ten focused tests that each build a fresh inventory. The out-of-stock test asserts both the exception's facts *and* that the stock didn't change — which is why it catches the platform's deliberately broken \`sell()\`.`,
    ],
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`A dataclass is still an ordinary class. \`@dataclass\` reads the annotated fields and *writes* methods for you — the generated \`__init__\` assigns each field and then calls \`self.__post_init__()\` if you defined one. You can print the generated signature:`,
      { code: py`import inspect
from dataclasses import dataclass


@dataclass
class Product:
    sku: str
    price: float = 0.0


print(inspect.signature(Product))   # (sku: str, price: float = 0.0) -> None
print(Product("PEN-01") == Product("PEN-01"))   # True: generated __eq__ compares fields`, lang: 'python' },
    ],
    technical: [
      py`**Exception hierarchies and \`except\` order.** \`except InventoryError\` matches any subclass because \`except\` uses \`isinstance\`-style matching against the exception's class and its MRO. Put specific handlers before general ones; Python picks the *first* matching clause.`,
      py`**\`raise ... from None\`** sets \`__suppress_context__\` on the new exception, so the traceback omits "During handling of the above exception, another exception occurred". Use \`from exc\` instead when the original error is useful for debugging (for example a JSON parse error inside a load). See [raising exceptions](lesson:raising-exceptions).`,
      py`**Decimal arithmetic** follows a *context* (precision 28 significant digits by default, rounding \`ROUND_HALF_EVEN\`). Multiplying \`Decimal("1.20") * 3\` gives \`Decimal("3.60")\` — Decimal keeps the trailing zero, preserving the number of decimal places, which is why money formats nicely.`,
      py`**Dataclass equality** compares fields as a tuple and requires the same class, so \`list(loaded) == list(shop)\` checks every product field by field. Mutable dataclasses set \`__hash__ = None\` (unhashable) because a hash that changes when a field changes would corrupt dicts and sets.`,
    ],
    production: [
      py`**Validation at the boundary.** Real services validate untrusted input once, where it enters (an HTTP request, a file, a CSV import), and pass validated objects around inside. Libraries like *pydantic* or *attrs* add declarative validators; the principle is the one you used in \`__post_init__\`. See [input validation](lesson:input-validation).`,
      py`**Concurrency and persistence.** A JSON file is fine for one user. With several writers you need locking or, more realistically, a database that makes "check stock and decrement" atomic. The \`Inventory\` API you designed (methods that raise domain errors) survives that change — only the storage underneath moves, which is the point of separating them ([clean architecture](lesson:clean-architecture)).`,
      py`**Tests as a safety net.** In a team, tests run automatically on every change (continuous integration). Fast, independent, behaviour-focused tests like yours are what make refactoring safe. Coverage tells you which lines ran; mutation testing tells you whether your asserts would actually catch a change.`,
    ],
  },
  mistakes: [
    {
      title: 'Using float for money',
      wrong: { code: py`price = 0.10
total = price * 3
print(total == 0.30)   # False: 0.30000000000000004`, lang: 'python' },
      right: { code: py`from decimal import Decimal

price = Decimal("0.10")
total = price * 3
print(total == Decimal("0.30"))   # True`, lang: 'python' },
      explanation: py`Binary floats can't represent most decimal fractions exactly, so small errors creep into sums and comparisons. Use \`Decimal\` built from strings (or integer cents) for money.`,
    },
    {
      title: 'Changing state before checking it',
      wrong: { code: py`def sell(self, sku, quantity):
    product = self.get(sku)
    product.quantity -= quantity
    if product.quantity < 0:
        raise OutOfStockError(sku, quantity, product.quantity + quantity)
    return product.price * quantity`, lang: 'python', static: true },
      right: { code: py`def sell(self, sku, quantity):
    product = self.get(sku)
    if quantity > product.quantity:
        raise OutOfStockError(sku, quantity, product.quantity)
    product.quantity -= quantity
    return product.price * quantity`, lang: 'python', static: true },
      explanation: py`In the wrong version the exception is raised *after* the stock went negative, and nothing puts it back. Every caller that catches \`OutOfStockError\` now sees corrupted data. Check first, change second.`,
    },
    {
      title: 'A mutable default argument',
      wrong: { code: py`class Inventory:
    def __init__(self, products=[]):
        self.products = products     # every Inventory() shares ONE list!


a = Inventory()
a.products.append("pen")
print(Inventory().products)          # ['pen']`, lang: 'python' },
      right: { code: py`class Inventory:
    def __init__(self, products=()):
        self.products = list(products)   # a fresh list per instance


a = Inventory()
a.products.append("pen")
print(Inventory().products)          # []`, lang: 'python' },
      explanation: py`Default values are evaluated once, when the \`def\` runs. A list default is shared by every call. Use an immutable default (\`()\` or \`None\`) and build a new list inside.`,
    },
    {
      title: 'Writing the save file in place',
      wrong: { code: py`with open("inventory.json", "w") as fh:     # truncates immediately
    json.dump(data, fh)                      # a crash here = empty file`, lang: 'python', static: true },
      right: { code: py`tmp = path.with_name(path.name + ".tmp")
tmp.write_text(json.dumps(data), encoding="utf-8")
os.replace(tmp, path)                        # old file or new file, never half`, lang: 'python', static: true },
      explanation: py`Opening with \`"w"\` empties the file before anything is written. If the program dies mid-write you lose all the data. Write elsewhere, then atomically replace.`,
    },
    {
      title: 'Tests that share state',
      wrong: { code: py`SHOP = make_inventory()        # one object for every test


def test_sell():
    SHOP.sell("PEN-01", 40)


def test_total_value():
    assert SHOP.total_value() == Decimal("62.00")   # depends on test order!`, lang: 'python', static: true },
      right: { code: py`def test_sell():
    shop = make_inventory()
    shop.sell("PEN-01", 40)
    assert shop.get("PEN-01").quantity == 0


def test_total_value():
    assert make_inventory().total_value() == Decimal("62.00")`, lang: 'python', static: true },
      explanation: py`When tests mutate a shared object, the result depends on which test ran first. Build fresh state in every test (or use a pytest fixture, which does that for you).`,
    },
  ],
  debugging: [
    {
      symptom: py`TypeError: Object of type Decimal is not JSON serializable`,
      cause: py`\`json.dumps\` was given a Decimal (or a dataclass) directly.`,
      fix: py`Convert to JSON-friendly types first: \`to_dict()\` with \`str(self.price)\`, then rebuild with \`Decimal(...)\` when loading.`,
    },
    {
      symptom: py`decimal.InvalidOperation: [<class 'decimal.ConversionSyntax'>]`,
      cause: py`\`Decimal()\` received a string that isn't a number, e.g. \`"£1.20"\` or \`"1,20"\`.`,
      fix: py`Catch \`InvalidOperation\` in your conversion helper and raise a clear \`ValueError(f"invalid price: {value!r}")\`; clean the input (strip currency symbols) at the boundary.`,
    },
    {
      symptom: py`TypeError: non-default argument 'name' follows default argument 'sku'`,
      cause: py`In a dataclass, a field without a default comes after a field with one, which would produce an invalid \`__init__\` signature.`,
      fix: py`Move fields with defaults to the end, or give the later field a default too (or use \`field(kw_only=True)\`, 3.10+).`,
    },
    {
      symptom: py`json.decoder.JSONDecodeError: Expecting value: line 1 column 1 (char 0)`,
      cause: py`The save file is empty or truncated — usually a crash during a non-atomic write.`,
      fix: py`Save with a temp file + \`os.replace()\`. When loading, catch \`JSONDecodeError\` and report which file is broken instead of a bare traceback.`,
    },
    {
      symptom: py`A test passes on its own but fails when the whole suite runs.`,
      cause: py`Tests share mutable state (a module-level inventory, a file left behind by another test).`,
      fix: py`Create fresh objects inside each test; give files unique names or clean them up; never rely on test order.`,
    },
  ],
  bestPractices: [
    'Validate in one place (the constructor) so invalid objects can never exist.',
    'Use Decimal from strings, or integer cents, for money — never float.',
    'Raise specific exceptions that inherit from one project base class, and keep the facts as attributes.',
    'Check every precondition before mutating state.',
    'Save files atomically and include a format version.',
    'Keep main.py thin; put logic in importable modules so it can be tested.',
    'One behaviour per test, fresh state per test, and test the failure paths.',
  ],

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'project-inventory-system-q1',
      type: 'mcq',
      prompt: 'Where is the best place to reject a `Product` with a negative price?',
      options: [
        { text: 'In Inventory.add(), before storing it', why: 'Then a Product with a negative price can still exist everywhere else (in tests, in storage, in reports). Validate where the object is created.' },
        'In Product.__post_init__, so an invalid Product can never be created',
        { text: 'In stock_report(), when the value is displayed', why: 'By then the bad data has already spread through the program.' },
        { text: 'Nowhere — Python is dynamically typed', why: 'Dynamic typing is about names, not about business rules. Rules still need checking.' },
      ],
      answer: 1,
      explanation: py`Validating in the constructor gives a guarantee: *if a Product exists, it is valid*. Every other module can then trust it without re-checking.`,
    },
    {
      id: 'project-inventory-system-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`from decimal import Decimal

print(0.1 + 0.2 == 0.3)
print(Decimal("0.1") + Decimal("0.2") == Decimal("0.3"))`,
      options: [
        { text: 'True then True', why: '0.1 and 0.2 have no exact binary representation, so the float sum is 0.30000000000000004.' },
        'False then True',
        { text: 'False then False', why: 'Decimals built from strings are exact decimal numbers, so the second comparison is True.' },
        { text: 'TypeError', why: 'Adding two Decimals and comparing with a Decimal is perfectly valid.' },
      ],
      answer: 1,
      explanation: py`Floats are binary fractions and pick up tiny errors; \`Decimal("0.1")\` is exactly one tenth. That's why the project stores prices as Decimal.`,
    },
    {
      id: 'project-inventory-system-q3',
      type: 'bug',
      prompt: 'A refused sale still lowers the stock. Click the line that causes it.',
      code: py`def sell(self, sku, quantity):
    product = self.get(sku)
    product.quantity -= quantity
    if product.quantity < 0:
        raise OutOfStockError(sku, quantity, product.quantity + quantity)
    return product.price * quantity`,
      answerLine: 3,
      explanation: py`The subtraction happens before the check. When the exception is raised, the stock is already negative and nothing restores it. Move the check above the change: \`if quantity > product.quantity: raise ...\`.`,
    },
    {
      id: 'project-inventory-system-q4',
      type: 'fill',
      prompt: 'Complete the exception so that `except InventoryError` also catches it and its message is set properly.',
      code: py`class OutOfStockError(___):
    def __init__(self, sku, requested, available):
        ___().__init__(f"only {available} of {sku} left")
        self.sku = sku`,
      answer: [['InventoryError'], ['super']],
      explanation: py`Inheriting from \`InventoryError\` puts it in the family; \`super().__init__(message)\` lets \`Exception\` store the message so \`str(exc)\` shows it.`,
    },
    {
      id: 'project-inventory-system-q5',
      type: 'output',
      prompt: 'What does this print?',
      code: py`from dataclasses import dataclass


@dataclass
class Item:
    sku: str
    qty: int = 0


a = Item("PEN", 3)
b = Item("PEN", 3)
print(a == b, a is b)`,
      answer: 'True False',
      accept: ['True False'],
      explanation: py`The generated \`__eq__\` compares field values, so \`a == b\`. They are still two separate objects, so \`a is b\` is \`False\`. The project's round-trip test relies on this field-by-field equality.`,
    },
    {
      id: 'project-inventory-system-q6',
      type: 'mcq',
      prompt: 'Your whole test suite passes. The platform then replaces `sell()` with a version that never checks the stock, and your suite *still* passes. What does that tell you?',
      options: [
        { text: 'The broken sell() is actually correct', why: 'It lets stock go negative, which breaks a core rule.' },
        'No test exercises the "not enough stock" path, so that rule is unprotected',
        { text: 'The tests are too slow', why: 'Speed has nothing to do with whether a test detects a bug.' },
        { text: 'You need more print() calls in the tests', why: 'Printing doesn’t make a test fail; only a failing assert or an exception does.' },
      ],
      answer: 1,
      explanation: py`A test suite is only as good as the bugs it catches. Deliberately breaking code (mutation testing) reveals rules that no assert checks.`,
    },
    {
      id: 'project-inventory-system-q7',
      type: 'short',
      prompt: 'Why does `save_inventory` write to a `.tmp` file and then call `os.replace()` instead of writing straight to `inventory.json`?',
      answer: py`Opening the real file for writing truncates it immediately; if the program crashes mid-write, the data is lost and the next load fails. Writing a complete temp file and then atomically replacing the old file means the file on disk is always either the old version or the new one, never a half-written mix.`,
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'project-inventory-system-layering',
      difficulty: 'intermediate',
      type: 'architecture',
      minutes: 5,
      question: 'Walk me through how you structured the inventory system and why. What would change if it had to move from a JSON file to a database?',
      answer: 'Separate modules by responsibility: a validated Product model, an Inventory class that owns the business rules and raises domain exceptions, a storage module for persistence, reports as pure functions, and a thin main. Dependencies point inward to the model. Moving to a database replaces only the storage layer (and ideally makes check-and-decrement atomic); the model, rules and tests barely change.',
      explanation: py`The key idea is *separation of concerns*: data validity (models), rules (inventory), I/O (storage) and presentation (report) change for different reasons, so they live in different places. With a database, the "check stock then subtract" step should become one atomic SQL statement or transaction, which is the one place where the rules and storage meet.`,
      whyAsked: 'Interviewers want to see that you can design small systems with clear boundaries, not just write functions.',
      mistakes: ['Describing files instead of responsibilities', 'Putting JSON or print calls inside the business logic', 'Not mentioning concurrency when a database comes up'],
      followUps: ['How would you test the inventory without touching the file system?', 'Where would you put a "discount" rule?', 'How do you prevent two cashiers overselling the last item?'],
      modelAnswer: 'I split it by responsibility. Product is a dataclass that validates itself, so any Product in the system is trustworthy. Inventory holds products in a dict keyed by SKU and owns the rules — no duplicates, positive quantities, never oversell — and it raises specific exceptions from one InventoryError family. Storage is a separate module that converts to a versioned JSON format and writes atomically, and reports are pure functions. If we moved to a database, only storage changes: I would add a repository with the same load and save operations, and make the sell operation a single conditional UPDATE inside a transaction so concurrent sales can’t oversell. The rules and most tests stay exactly the same.',
    },
    {
      id: 'project-inventory-system-decimal',
      difficulty: 'beginner',
      type: 'comparison',
      minutes: 3,
      question: 'Why use Decimal instead of float for prices? Are there alternatives or downsides?',
      answer: 'Floats are binary fractions and can’t represent most decimal amounts exactly, so totals drift (0.1 + 0.2 != 0.3). Decimal does exact base-10 arithmetic. The alternative is integer cents. Downsides: Decimal is slower than float and must be built from strings, and JSON needs it as a string.',
      explanation: py`For money, correctness beats speed. \`Decimal("0.10") * 3 == Decimal("0.30")\` is exact; \`0.10 * 3\` is \`0.30000000000000004\`. Integer cents (\`price_cents = 120\`) are also exact and fast, but every division (tax, discounts) needs an explicit rounding rule — which Decimal also gives you via \`quantize()\` and rounding modes.`,
      whyAsked: 'Money bugs are expensive and common; this checks basic numeric literacy.',
      mistakes: ['Saying “just round at the end”', 'Building Decimal from a float literal (Decimal(0.1))', 'Not knowing integer cents is a valid option'],
      followUps: ['How do you round a Decimal to cents?', 'What is banker’s rounding?', 'How would you store prices in a database?'],
      modelAnswer: 'Floats are binary, so most decimal fractions like 0.1 can only be approximated, and those tiny errors show up in sums and equality checks. Decimal does base-10 arithmetic exactly, so a price of 1.20 times 3 is exactly 3.60. I always construct Decimals from strings, never from floats, or I’d copy the float’s error. An alternative is storing integer cents, which is exact and fast; either way I make rounding explicit with quantize and a rounding mode. The cost is some speed and the need to serialise Decimals as strings in JSON.',
    },
    {
      id: 'project-inventory-system-oversell',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 5,
      question: 'The inventory now runs as a web service with several worker processes. Customers occasionally buy an item that is already sold out. What is going on, and how do you fix it?',
      answer: 'A race condition: two requests both read “1 in stock”, both pass the check, both subtract. Fix it by making check-and-decrement atomic in the shared store — e.g. UPDATE products SET quantity = quantity - ? WHERE sku = ? AND quantity >= ? and check the affected row count, inside a transaction — or use row locks / optimistic version numbers. In-process Python checks can’t protect state shared between processes.',
      explanation: py`Each worker process has its own memory, so the only shared truth is the database. A conditional update lets the database do the check and the change as one indivisible step; if \`rowcount == 0\`, raise \`OutOfStockError\`. Optimistic locking (a \`version\` column checked in the \`WHERE\`) is the general form for more complex updates.`,
      code: { lang: 'python', code: py`import sqlite3

con = sqlite3.connect(":memory:")
con.execute("CREATE TABLE products (sku TEXT PRIMARY KEY, quantity INTEGER NOT NULL)")
con.execute("INSERT INTO products VALUES ('MUG-01', 1)")


def sell(con, sku, qty):
    with con:  # one transaction
        cur = con.execute(
            "UPDATE products SET quantity = quantity - ? WHERE sku = ? AND quantity >= ?",
            (qty, sku, qty),
        )
    return cur.rowcount == 1


print(sell(con, "MUG-01", 1))   # True: the last mug is sold
print(sell(con, "MUG-01", 1))   # False: refused, stock never goes negative` },
      whyAsked: 'Tests understanding of concurrency beyond a single process — a very common production bug.',
      mistakes: ['Suggesting a threading.Lock (it doesn’t span processes)', 'Reading the quantity in one query and updating in another without a transaction or lock', 'Ignoring the affected row count'],
      followUps: ['What is optimistic vs pessimistic locking?', 'What isolation level does your database use by default?', 'How would you test this race?'],
      modelAnswer: 'This is a check-then-act race: two requests read the same stock level, both decide there is enough, and both subtract. A Python lock won’t help because the workers are separate processes, so the fix has to live in the shared database. I would make the check and the decrement a single conditional UPDATE — set quantity to quantity minus n where the SKU matches and quantity is at least n — and then check the affected row count; zero rows means out of stock. For more complex changes I would use a transaction with a version column for optimistic locking, or SELECT FOR UPDATE where the database supports it.',
    },
    {
      id: 'project-inventory-system-flaky-tests',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'A teammate’s inventory tests pass individually but fail when the whole suite runs, and the failures change when tests are reordered. What do you look for?',
      answer: 'Shared mutable state between tests: a module-level Inventory, a class attribute, a mutable default argument, or a file one test writes and another reads. Each test should build its own fresh state (a fixture) and clean up external resources.',
      explanation: py`Order-dependent failures are the signature of tests leaking state. Look for objects created at import time and mutated by tests, globals, caches, files with fixed names and environment variables. Fix with per-test setup (\`make_inventory()\` / pytest fixtures, \`tmp_path\` for files) and run tests in random order (*pytest-randomly*) to flush out new leaks.`,
      whyAsked: 'Flaky tests waste huge amounts of team time; knowing their usual causes is a practical skill.',
      mistakes: ['Re-running until green', 'Adding sleeps', 'Making tests depend on running in a specific order'],
      followUps: ['What does a pytest fixture’s scope control?', 'How would you share an expensive resource safely between tests?'],
      modelAnswer: 'When results depend on order, I assume tests share state. I look for a module-level Inventory or other global that tests mutate, mutable default arguments, class attributes used as storage, and files with fixed names that one test writes and another reads. The fix is to give every test fresh state — a factory function or a pytest fixture — and to use temporary directories for files. Then I run the suite in random order to make sure no hidden coupling is left.',
    },
    {
      id: 'project-inventory-system-batch-sale',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'Write `apply_sales(stock, sales)` where `stock` is a dict `{sku: quantity}` and `sales` is a list of `(sku, quantity)` pairs. It must be all-or-nothing: if any line refers to an unknown SKU (raise `KeyError`) or would take a product below zero in total (raise `ValueError`), raise and leave `stock` completely unchanged. Otherwise subtract everything and return the number of units sold.',
      answer: 'Validate the whole batch against the totals first (summing repeated SKUs), then apply all changes. Never mutate while validating.',
      explanation: py`Atomicity means "either every change happens or none does". The simplest safe approach is two passes: pass one totals the demand per SKU and checks it against the stock, raising on the first problem; pass two applies the already-validated changes. Repeated SKUs must be summed — checking each line separately would let two lines of 3 pass against a stock of 4.`,
      starter: { files: { 'main.py': py`def apply_sales(stock, sales):
    # TODO: all-or-nothing
    sold = 0
    for sku, quantity in sales:
        stock[sku] -= quantity
        sold += quantity
    return sold


stock = {"PEN-01": 10, "MUG-01": 4}
print(apply_sales(stock, [("PEN-01", 3), ("MUG-01", 1)]), stock)
` } },
      tests: [
        { name: 'applies a valid batch and returns units sold', code: py`s = {"PEN-01": 10, "MUG-01": 4}
assert apply_sales(s, [("PEN-01", 3), ("MUG-01", 4)]) == 7
assert s == {"PEN-01": 7, "MUG-01": 0}` },
        { name: 'an oversell anywhere changes nothing', code: py`s = {"PEN-01": 10, "MUG-01": 4}
with raises(ValueError):
    apply_sales(s, [("PEN-01", 3), ("MUG-01", 5)])
assert s == {"PEN-01": 10, "MUG-01": 4}` },
        { name: 'repeated SKUs are totalled', code: py`s = {"MUG-01": 4}
with raises(ValueError):
    apply_sales(s, [("MUG-01", 3), ("MUG-01", 3)])
assert s == {"MUG-01": 4}` },
        { name: 'unknown SKU raises KeyError and changes nothing', code: py`s = {"PEN-01": 10}
with raises(KeyError):
    apply_sales(s, [("PEN-01", 1), ("GHOST", 1)])
assert s == {"PEN-01": 10}` },
      ],
      solution: { files: { 'main.py': py`from collections import Counter


def apply_sales(stock, sales):
    demand = Counter()
    for sku, quantity in sales:
        if sku not in stock:
            raise KeyError(sku)
        demand[sku] += quantity
    for sku, wanted in demand.items():
        if wanted > stock[sku]:
            raise ValueError(f"{sku}: wanted {wanted}, only {stock[sku]} in stock")
    for sku, wanted in demand.items():
        stock[sku] -= wanted
    return sum(demand.values())


stock = {"PEN-01": 10, "MUG-01": 4}
print(apply_sales(stock, [("PEN-01", 3), ("MUG-01", 1)]), stock)
` } },
      hints: ['Do not touch stock until you know every line is valid.', 'Total the demand per SKU first — collections.Counter is handy.', 'Three loops: collect and check SKUs, compare totals with stock, then subtract.'],
      whyAsked: 'Checks that you think about partial failure and state consistency, not just the happy path.',
      mistakes: ['Subtracting line by line and trying to roll back on error', 'Checking each line separately and missing repeated SKUs', 'Mutating the input while iterating over it'],
      followUps: ['How would you do the same in SQL?', 'What if the stock lived in another service you can’t lock?'],
      modelAnswer: 'I would make it two-phase. First I validate the whole batch without touching the stock: check every SKU exists and total the requested quantity per SKU with a Counter, then compare each total with the stock and raise on the first problem. Only when everything is valid do I apply the subtractions, which can no longer fail. That avoids messy rollback code, and totalling per SKU catches the subtle case where two lines for the same product are each fine on their own but too much together.',
    },
  ],

  takeaways: [
    'Split a program by responsibility — model, rules, storage, presentation, tests — with dependencies pointing toward the model.',
    'Validate in __post_init__ so invalid objects can never be created; use TypeError for wrong types and ValueError for bad values.',
    'Use Decimal built from strings (or integer cents) for money, and serialise it as a string.',
    'Raise specific exceptions from one base class, carrying the facts as attributes.',
    'In every state-changing method: check all preconditions first, change state last.',
    'Save files atomically (temp file + os.replace) with a format version, and validate data when loading.',
    'Good tests are independent, behaviour-named and cover failure paths — and you can measure their worth by breaking the code on purpose.',
  ],
}
