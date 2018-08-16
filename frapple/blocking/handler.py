
from csftool.methods import CsfToolRequestHandlerMethods
from csftool.methods import CsfToolVarietyRequestHandlerMethods

from frapple.factory import AppleFrostToolFactory
from frapple.handler import AppleFrostRequestHandlerMethods

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

from csftool.blocking.handler import CsfToolOptionsRequestHandler
FRAPPLE_OPTIONS_HANDLER = CsfToolOptionsRequestHandler

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class AppleFrostBlockingRequestHandler(AppleFrostToolFactory,
                                       AppleFrostRequestHandlerMethods,
                                       CsfToolRequestHandlerMethods):

    def __init__(self, server_config, **kwargs):
        # initialize the factory and it's inherited config/registry
        AppleFrostToolFactory.__init__(self, server_config.mode)
        # server config requirements for CsfToolRequestHandlerMethods
        self.setServerConfig(server_config, **kwargs)
        self.setToolConfig(server_config)
        # additional attributes required by specific request handlers
        if kwargs: self.setHandlerAttributes(self, **kwargs)


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class AppleFrostVarietyRequestHandler(AppleFrostToolFactory,
                                      AppleFrostRequestHandlerMethods,
                                      CsfToolVarietyRequestHandlerMethods):

    def __init__(self, server_config, **kwargs):
        # initialize the factory and it's inherited config/registry
        AppleFrostToolFactory.__init__(self, server_config.mode)
        # server config requirements for CsfToolRequestHandlerMethods
        self.setServerConfig(server_config, **kwargs)
        self.setToolConfig(server_config)
        # additional attributes required by specific request handlers
        if kwargs: self.setHandlerAttributes(self, **kwargs)

