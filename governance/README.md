# Resource Factory Governance (_types_)

RF's use of the term `governance` is a convention which describes our religious separation of interface and contract defintions from implementation of those definition.

We separate definition of our _governance_ of _types_ (`interface`, `type`, etc.) from _implementations_ and instances (`const`, `class`) whenever possible. This separation is valuable when the same code is shared between server and client (because types are erased when JS is emitted). 

It also helps to make sure our interfaces are not influenced or coupled to implementations.

