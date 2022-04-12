const Budget = require("../models/budget");

module.exports = {
  index,
  new: newBudget,
  create,
  show,
  delete: deleteBudget,
  edit,
  update,
  archive,
  indexArchived,
  unarchive,
};

// Display Current Budgets
async function index(req, res) {
  try {
    const budgets = await Budget.find({})
                                .sort({ updatedAt: "desc" })
                                .exec();

    res.render("budgets/index", {
      title: "Current Budgets",
      budgets
    });
  } catch (err) {
    res.redirect("/home");
  }
}

// Render Form to Create New Budget
function newBudget(req, res) {
  res.render("budgets/new", {
    title: "New Budget",
  });
}

// Create New Budget
async function create(req, res) {
  try {
    const budget = await new Budget(req.body);
    if (!req.user) return res.redirect("/home");
    budget.userId = await req.user._id;
    budget.remaining = await budget.budget;
    await budget.save();

    res.redirect("/budgets")
  } catch (err) {
    res.redirect('/budgets/new');
  }
}

// Display Page for Selected Budget
async function show(req, res) {
  try {
    const budget = await Budget.findById(req.params.id);
    await budget.entries.sort((a, b) => b.date - a.date);
    await budget.save();

    res.render("budgets/show", {
      title: budget.name,
      budget,
      remaining: budget.budget
    })
  } catch (err) {
    res.redirect("/budgets");
  }
}

// Delete Budget
async function deleteBudget(req, res) {
  try {
    if (!req.user) return res.redirect("/home");
    await Budget.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.redirect("/budgets");
  } catch (err) {
    res.redirect("/budgets");
  }
}

// Display Page to Update a Budget
function edit(req, res) {
  if (!req.user) return res.redirect("/home");
  Budget.findOne(
    { _id: req.params.id, userId: req.user._id },
    function (err, budget) {
      if (err || !budget) return res.redirect(`/budgets/${req.params.id}`);
      res.render("budgets/edit", {
        title: "Update Budget",
        budget,
      });
    }
  );
}

// Apply Changes Made to a Budget
function update(req, res) {
  if (!req.user) return res.redirect("/home");
  Budget.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    req.body,
    { new: true },
    function (err, budget) {
      budget.remaining = budget.budget - budget.spent;
      budget.save();
      if (err || !budget) return res.redirect(`/budgets/${budget._id}`);
      res.redirect(`/budgets/${budget._id}`);
    }
  );
}

// Archive Selected Budget
function archive(req, res) {
  if (!req.user) return res.redirect("/home");
  Budget.findById(req.params.id, function (err, budget) {
    budget.archived = true;
    budget.save();
    res.redirect("/budgets");
  });
}

// Display Archived Budgets
function indexArchived(req, res) {
  Budget.find({})
    .sort({ updatedAt: "desc" }) // Sort Budgets with Most Recently Updated at Top
    .exec(function (err, budgets) {
      if (err) return res.redirect("/home");
      res.render("budgets/archived", {
        title: "Archived Budgets",
        budgets,
      });
    });
}

// Unarchive Selected Budget
function unarchive(req, res) {
  if (!req.user) return res.redirect("/home");
  Budget.findById(req.params.id, function (err, budget) {
    budget.archived = false;
    budget.save();
    res.redirect("/budgets/archived");
  });
}
